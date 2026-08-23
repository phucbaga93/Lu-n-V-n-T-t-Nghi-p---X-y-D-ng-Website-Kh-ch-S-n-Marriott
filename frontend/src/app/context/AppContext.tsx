"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User, Room, Booking, CartItem, getLocalToday } from "../data/mockData";
import { api } from "../data/api";

interface AppContextType {
  currentUser: User | null;
  users: User[];
  rooms: Room[];
  bookings: Booking[];
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  addBooking: (booking: Booking) => Promise<Booking | null>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  addRoom: (room: Room) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
  deleteUser: (id: string) => Promise<void>;
  register: (user: any) => Promise<User | null>;
  addGuestBooking: (booking: any) => Promise<Booking | null>;
  validatePromo: (code: string, amount: number) => Promise<any>;
  getRoomReviews: (roomTypeId: number) => Promise<any[]>;
  submitReview: (review: any) => Promise<any>;
  changeRoom: (id: string, chiTietId: number, phongMoiId: number) => Promise<void>;
  adminCancelBooking: (id: string, reason: string, waivePenalty: boolean) => Promise<void>;
  fetchRooms: (checkIn?: string, checkOut?: string, location?: string) => Promise<void>;
  fetchBookings: () => Promise<void>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🟢 LỰA CHỌN B: Chỉ dùng sessionStorage để tự động Đăng xuất khi Đóng trình duyệt
      localStorage.removeItem("current_user"); // Dọn dẹp localStorage cũ
      const savedUser = sessionStorage.getItem("current_user");
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
      // 🟢 CHUYỂN GIỎ HÀNG SANG sessionStorage: Tắt web/đóng trình duyệt là Giỏ hàng tự động reset sạch
      localStorage.removeItem("booking_cart"); // Dọn dẹp localStorage cũ
      const savedCart = sessionStorage.getItem("booking_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          const today = getLocalToday();
          const maxDateObj = new Date();
          maxDateObj.setMonth(maxDateObj.getMonth() + 6);
          const maxDate = maxDateObj.toISOString().split("T")[0];
          const sanitized = parsed.map((item: any) => {
            let itemCheckIn = item.checkIn || today;
            let itemCheckOut = item.checkOut || today;
            
            const checkInDate = new Date(itemCheckIn);
            if (checkInDate > maxDateObj) {
              itemCheckIn = maxDate;
              const outDate = new Date(maxDateObj.getTime() + 86400000);
              itemCheckOut = outDate.toISOString().split("T")[0];
            }
            return {
              ...item,
              checkIn: itemCheckIn,
              checkOut: itemCheckOut
            };
          });
          setCart(sanitized);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const updated = [...prev, item];
      sessionStorage.setItem("booking_cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      sessionStorage.setItem("booking_cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    sessionStorage.removeItem("booking_cart");
    localStorage.removeItem("booking_cart");
  }, []);

  const updateCartItem = useCallback((id: string, updates: Partial<CartItem>) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      sessionStorage.setItem("booking_cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setCurrentUserAndSave = useCallback((user: User | null) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_user"); // Dọn dẹp vĩnh viễn ở localStorage
      if (user) {
        const userStr = JSON.stringify(user);
        sessionStorage.setItem("current_user", userStr);
      } else {
        sessionStorage.removeItem("current_user");
      }
    }
  }, []);

  const fetchRooms = useCallback(async (checkIn?: string, checkOut?: string, location?: string) => {
    try {
      const data = await api.getRooms(checkIn, checkOut, location);
      setRooms(data);
    } catch (e) {
      console.error("Failed to fetch rooms:", e);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === "customer") {
        const data = await api.getMyBookings(currentUser.id);
        setBookings(data);
      } else {
        const data = await api.getAllBookings();
        setBookings(data);
      }
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role === "customer") return;
    try {
      const data = await api.getCustomers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
      fetchUsers();
    } else {
      setBookings([]);
      setUsers([]);
    }
  }, [currentUser, fetchBookings, fetchUsers]);

  // Short Polling (Phương án 1): Tự động cập nhật dữ liệu phòng và đặt phòng mỗi 15 giây
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms();
      if (currentUser) {
        fetchBookings();
        fetchUsers();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser, fetchRooms, fetchBookings, fetchUsers]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const user = await api.login(email, password);
    setCurrentUserAndSave(user);
    clearCart();
    return user;
  }, [setCurrentUserAndSave, clearCart]);

  const logout = useCallback(() => {
    setCurrentUserAndSave(null);
    clearCart();
  }, [setCurrentUserAndSave, clearCart]);

  const addBooking = useCallback(async (booking: Booking): Promise<Booking | null> => {
    try {
      const newBooking = await api.createBooking(booking);
      setBookings(prev => [newBooking, ...prev]);
      fetchRooms();
      return newBooking;
    } catch (e) {
      console.error("Failed to create booking:", e);
      return null;
    }
  }, [fetchRooms]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      if (updates.status && Object.keys(updates).length === 1) {
        await api.updateBookingStatus(id, updates.status);
      } else {
        await api.updateBooking(id, updates);
      }
      fetchBookings();
      fetchRooms();
    } catch (e) {
      console.error("Failed to update booking:", e);
      throw e;
    }
  }, [fetchBookings, fetchRooms]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      await api.cancelBooking(id);
      fetchBookings();
      fetchRooms();
    } catch (e) {
      console.error("Failed to cancel booking:", e);
    }
  }, [fetchBookings, fetchRooms]);

  const changeRoom = useCallback(async (id: string, chiTietId: number, phongMoiId: number) => {
    try {
      await api.changeRoom(id, chiTietId, phongMoiId);
      fetchBookings();
      fetchRooms();
    } catch (e) {
      console.error("Failed to change room:", e);
    }
  }, [fetchBookings, fetchRooms]);

  const adminCancelBooking = useCallback(async (id: string, reason: string, waivePenalty: boolean) => {
    try {
      await api.adminCancelBooking(id, reason, waivePenalty);
      fetchBookings();
      fetchRooms();
    } catch (e) {
      console.error("Failed to cancel booking (admin):", e);
    }
  }, [fetchBookings, fetchRooms]);

  const addRoom = useCallback(async (room: Room) => {
    try {
      const newRoom = await api.addRoom(room);
      setRooms(prev => [...prev, newRoom]);
    } catch (e) {
      console.error("Failed to add room:", e);
      throw e;
    }
  }, []);

  const updateRoom = useCallback(async (id: string, updates: Partial<Room>) => {
    try {
      const updated = await api.updateRoom(id, updates);
      setRooms(prev => prev.map(r => r.id === id ? updated : r));
    } catch (e) {
      console.error("Failed to update room:", e);
      throw e;
    }
  }, []);

  const deleteRoom = useCallback(async (id: string) => {
    try {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("Failed to delete room:", e);
    }
  }, []);

  const addUser = useCallback(async (user: User) => {
    try {
      const newUser = await api.addCustomer(user);
      setUsers(prev => [...prev, newUser]);
    } catch (e) {
      console.error("Failed to add customer:", e);
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      if (currentUser?.id === id) {
        const updated = await api.updateProfile(id, updates);
        setCurrentUserAndSave(updated);
      } else {
        await api.updateCustomer(id, updates);
        fetchUsers();
      }
    } catch (e) {
      console.error("Failed to update user:", e);
    }
  }, [currentUser, setCurrentUserAndSave, fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await api.deleteCustomer(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error("Failed to delete user:", e);
      throw e;
    }
  }, []);

  const register = useCallback(async (user: any): Promise<User | null> => {
    try {
      const newUser = await api.register(user);
      setCurrentUserAndSave(newUser);
      clearCart();
      return newUser;
    } catch (e) {
      console.error("Registration failed:", e);
      throw e;
    }
  }, [setCurrentUserAndSave, clearCart]);

  const addGuestBooking = useCallback(async (booking: any): Promise<Booking | null> => {
    try {
      const newBooking = await api.quickBooking(booking);
      fetchRooms();
      return newBooking;
    } catch (e) {
      console.error("Failed to add guest booking:", e);
      throw e;
    }
  }, [fetchRooms]);

  const validatePromo = useCallback(async (code: string, amount: number): Promise<any> => {
    try {
      return await api.validatePromo(code, amount);
    } catch (e) {
      console.error("Failed to validate promo code:", e);
      throw e;
    }
  }, []);

  const getRoomReviews = useCallback(async (roomTypeId: number): Promise<any[]> => {
    try {
      return await api.getRoomReviews(roomTypeId);
    } catch (e) {
      console.error("Failed to get reviews:", e);
      return [];
    }
  }, []);

  const submitReview = useCallback(async (review: any): Promise<any> => {
    try {
      return await api.submitReview(review);
    } catch (e) {
      console.error("Failed to submit review:", e);
      throw e;
    }
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<any> => {
    if (!currentUser) throw new Error("Chưa đăng nhập");
    return await api.changePassword(currentUser.id, oldPassword, newPassword);
  }, [currentUser]);

  return (
    <AppContext.Provider value={{ currentUser, users, rooms, bookings, login, logout, addBooking, updateBooking, cancelBooking, changeRoom, adminCancelBooking, addRoom, updateRoom, deleteRoom, addUser, updateUser, changePassword, deleteUser, register, addGuestBooking, validatePromo, getRoomReviews, submitReview, fetchRooms, fetchBookings, cart, addToCart, removeFromCart, clearCart, updateCartItem }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
