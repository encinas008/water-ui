import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { UserDetails } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import { SwitchComponent } from '../../shared/components/form/input/switch.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SwitchComponent],
  templateUrl: './users-list.component.html',
  styles: ``
})
export class UsersListComponent implements OnInit {
  users: UserDetails[] = [];
  isLoading = false;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data: UserDetails[]) => { // Corrected type usage here
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        toast.error('Error al cargar usuarios');
        this.isLoading = false;
      }
    });
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '?';

    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  getAvatarColor(name: string | undefined): string {
    if (!name) return 'bg-gray-500';

    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  toggleStatus(user: UserDetails): void {
    const newStatus = !user.active;
    const action = newStatus ? 'activar' : 'desactivar';

    if (confirm(`¿Estás seguro de que deseas ${action} al usuario ${user.username}?`)) {
      this.userService.updateStatus(user.id, newStatus).subscribe({
        next: () => {
          toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`);
          user.active = newStatus;
        },
        error: (err) => {
          console.error(err);
          toast.error(`Error al ${action} el usuario`);
        }
      });
    }
  }
}
