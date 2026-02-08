import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { toast } from 'ngx-sonner';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

@Component({
    selector: 'app-change-password-card',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalComponent,
        ButtonComponent,
        LabelComponent,
        InputFieldComponent
    ],
    templateUrl: './change-password-card.component.html',
})
export class ChangePasswordCardComponent {
    @Input() userId!: string;

    isOpen = false;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    isLoading = false;

    constructor(private userService: UserService) { }

    openModal() {
        this.isOpen = true;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
    }

    closeModal() {
        this.isOpen = false;
    }

    handleSave() {
        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            toast.error('Por favor, complete todos los campos');
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            toast.error('La nueva contraseña y la confirmación no coinciden');
            return;
        }

        if (this.newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        this.isLoading = true;
        this.userService.changePassword(this.userId, {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword
        }).subscribe({
            next: () => {
                toast.success('Contraseña actualizada correctamente');
                this.isLoading = false;
                this.closeModal();
            },
            error: (err) => {
                console.error('Error changing password:', err);
                const errorMsg = typeof err.error === 'string' ? err.error : (err.error?.message || 'No se pudo actualizar la contraseña');
                toast.error(errorMsg);
                this.isLoading = false;
            }
        });
    }
}
