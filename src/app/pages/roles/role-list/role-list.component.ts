import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../shared/services/role.service';
import { RoleOutputDto } from '../../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, RouterModule, PageBreadcrumbComponent, ButtonComponent],
    templateUrl: './role-list.component.html'
})
export class RoleListComponent implements OnInit {
    roles: RoleOutputDto[] = [];
    loading = false;

    constructor(
        private roleService: RoleService,
        private authService: AuthService
    ) { }

    get canManageRoles(): boolean {
        const userInfo = this.authService.getUserInfo();
        const userRole = userInfo?.role?.trim()?.toUpperCase() || '';
        const normalized = userRole.replace(/\s+/g, '_');
        return normalized === 'SUPER_ADMIN' || normalized === 'SUPER_ADMINISTRADOR';
    }

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles() {
        this.loading = true;
        this.roleService.getAll().subscribe({
            next: (data) => {
                this.roles = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                toast.error('Error al cargar roles');
            }
        });
    }

    deleteRole(id: string) {
        if (confirm('¿Estás seguro de eliminar este rol?')) {
            this.roleService.delete(id).subscribe({
                next: () => {
                    toast.success('Rol eliminado');
                    this.loadRoles();
                },
                error: (err) => {
                    toast.error('Error al eliminar rol');
                }
            });
        }
    }
}
