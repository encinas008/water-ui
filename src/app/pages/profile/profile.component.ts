import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ChangePasswordCardComponent } from '../../shared/components/user-profile/change-password-card/change-password-card.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    ChangePasswordCardComponent,
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  currentUserId: string;

  constructor(private authService: AuthService) {
    const userInfo = this.authService.getUserInfo();
    this.currentUserId = userInfo?.id || userInfo?.userId || userInfo?.sub || '';
  }
}
