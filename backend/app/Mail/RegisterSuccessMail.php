<?php

namespace App\Mail;

use App\Models\NguoiDung;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RegisterSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    /**
     * Create a new message instance.
     *
      * @param NguoiDung $user
     */
    public function __construct(NguoiDung $user)
    {
        $this->user = $user;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Chào mừng thành viên Marriott Bonvoy mới!')
                    ->view('emails.register_success');
    }
}
