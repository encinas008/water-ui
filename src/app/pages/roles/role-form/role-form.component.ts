import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleService } from '../../../shared/services/role.service';
import { toast } from 'ngx-sonner';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, PageBreadcrumbComponent, ButtonComponent, InputFieldComponent, LabelComponent],
    templateUrl: './role-form.component.html'
})
export class RoleFormComponent implements OnInit {
    roleForm: FormGroup;
    isEditMode = false;
    roleId: string | null = null;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private roleService: RoleService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.roleForm = this.fb.group({
            name: ['', [Validators.required]],
            code: ['', [Validators.required]],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.roleId = this.route.snapshot.paramMap.get('id');
        if (this.roleId) {
            this.isEditMode = true;
            this.loadRole(this.roleId);
        }
    }

    loadRole(id: string) {
        this.loading = true;
        this.roleService.getById(id).subscribe({
            next: (role) => {
                this.roleForm.patchValue(role);
                this.loading = false;
            },
            error: () => {
                toast.error('Error al cargar el rol');
                this.router.navigate(['/roles']);
            }
        });
    }

    onSubmit() {
        if (this.roleForm.invalid) return;

        this.loading = true;
        const roleData = this.roleForm.value;

        if (this.isEditMode && this.roleId) {
            this.roleService.update(this.roleId, roleData).subscribe({
                next: () => {
                    toast.success('Rol actualizado correctamente');
                    this.router.navigate(['/roles']);
                },
                error: () => {
                    this.loading = false;
                    toast.error('Error al actualizar el rol');
                }
            });
        } else {
            this.roleService.create(roleData).subscribe({
                next: () => {
                    toast.success('Rol creado correctamente');
                    this.router.navigate(['/roles']);
                },
                error: () => {
                    this.loading = false;
                    toast.error('Error al crear el rol');
                }
            });
        }
    }
}
