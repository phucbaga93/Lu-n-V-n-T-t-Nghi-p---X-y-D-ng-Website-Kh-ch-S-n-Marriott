<?php

namespace App\Mail;

use App\Models\NguoiDung;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $tempPassword;

    /**
     * Create a new message instance.
     *
     * @param NguoiDung $user
     * @param string $tempPassword
     */
    public function __construct(NguoiDung $user, string $tempPassword)
    {
        $this->user = $user;
        $this->tempPassword = $tempPassword;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Yêu cầu cấp lại mật khẩu tạm thời Marriott Hotel')
                    ->view('emails.forgot_password');
    }
}
