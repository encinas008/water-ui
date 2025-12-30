import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';

  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingrese usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signIn(this.username, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/water-bills']);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Por favor verifique sus credenciales.';
      }
    });
  }
}
