import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { UserDetails } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-semibold text-black dark:text-white">
        Administración de Usuarios
      </h2>
      <nav>
        <ol class="flex items-center gap-2">
          <li>
            <a class="font-medium" routerLink="/dashboard">Dashboard /</a>
          </li>
          <li class="font-medium text-primary">Usuarios</li>
        </ol>
      </nav>
    </div>

    <div class="flex flex-col gap-10">
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="flex justify-between items-center py-6 px-4 md:px-6 xl:px-7.5">
          <h4 class="text-xl font-semibold text-black dark:text-white">
            Lista de Usuarios
          </h4>
          <a
            routerLink="/users/add"
            class="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <span>
              <svg
                class="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 18.3333C5.41667 18.3333 1.66667 14.5833 1.66667 10C1.66667 5.41667 5.41667 1.66667 10 1.66667C14.5833 1.66667 18.3333 5.41667 18.3333 10C18.3333 14.5833 14.5833 18.3333 10 18.3333ZM10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0Z"
                  fill=""
                />
                <path
                  d="M10 5V15M5 10H15"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            Nuevo Usuario
          </a>
        </div>

        <div class="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div class="col-span-2 flex items-center">
            <p class="font-medium">Nombre Completo</p>
          </div>
          <div class="col-span-2 hidden items-center sm:flex">
            <p class="font-medium">Usuario (Login)</p>
          </div>
          <div class="col-span-2 flex items-center">
            <p class="font-medium">Rol</p>
          </div>
          <div class="col-span-1 flex items-center">
             <p class="font-medium">DNI</p>
          </div>
          <div class="col-span-1 flex items-center justify-end">
            <p class="font-medium">Acciones</p>
          </div>
        </div>

        <div
          *ngFor="let user of users"
          class="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5 hover:bg-gray-2 dark:hover:bg-meta-4"
        >
          <div class="col-span-2 flex items-center">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                <!-- Initials Avatar -->
                <div [ngClass]="getAvatarColor(user.profile.name + ' ' + user.profile.lastname)"
                    class="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-semibold">
                    {{ getInitials(user.profile.name + ' ' + user.profile.lastname) }}
                </div>
                <p class="text-sm text-black dark:text-white">{{ user.profile.name }} {{ user.profile.lastname }}</p>
            </div>
          </div>
          <div class="col-span-2 hidden items-center sm:flex">
            <p class="text-sm text-black dark:text-white">{{ user.username }}</p>
          </div>
          <div class="col-span-2 flex items-center">
            <p class="text-sm text-black dark:text-white">{{ user.role?.name || 'Sin Rol' }}</p>
          </div>
            <div class="col-span-1 flex items-center">
            <p class="text-sm text-black dark:text-white">{{ user.profile.dni }}</p>
          </div>
          <div class="col-span-1 flex items-center justify-end gap-2.5">
            <a
              [routerLink]="['/users/edit', user.id]"
              class="hover:text-primary"
              title="Editar"
            >
              <svg
                class="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.17812 8.99981 3.17812C14.5686 3.17812 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.68731 9.00001C2.39043 10.2094 5.0623 13.6969 8.99981 13.6969C12.9373 13.6969 15.6092 10.2094 16.3123 9.00001C15.6092 7.79063 12.9373 4.30313 8.99981 4.30313C5.0623 4.30313 2.39043 7.79063 1.68731 9.00001Z"
                  fill=""
                />
                <path
                  d="M9.00004 11.3906C7.67816 11.3906 6.60941 10.3218 6.60941 8.99998C6.60941 7.6781 7.67816 6.60935 9.00004 6.60935C10.3219 6.60935 11.3907 7.6781 11.3907 8.99998C11.3907 10.3218 10.3219 11.3906 9.00004 11.3906ZM9.00004 7.73435C8.30379 7.73435 7.73441 8.30373 7.73441 8.99998C7.73441 9.69623 8.30379 10.2656 9.00004 10.2656C9.69629 10.2656 10.2657 9.69623 10.2657 8.99998C10.2657 8.30373 9.69629 7.73435 9.00004 7.73435Z"
                  fill=""
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
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
}
