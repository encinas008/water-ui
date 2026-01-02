import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent, Option } from '../../shared/components/form/select/select.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { UserService } from '../../shared/services/user.service';
import { RoleService } from '../../shared/services/role.service';
import { CommonService } from '../../shared/services/common.service';
import { toast } from 'ngx-sonner';
import { CommonOutputDto } from '../../shared/models/common.models';
import { UserDetails, UserInputDto, UpdateUserInputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent
  ],
  template: `
    <div>
      <app-page-breadcrumb [pageTitle]="isEditMode ? 'Editar Usuario' : 'Crear Usuario'" />

      <div class="space-y-6">
        <!-- Información Personal -->
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 class="text-lg font-medium text-gray-800 dark:text-white">
              Información Personal
            </h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <app-label>DNI <span class="text-error-500">*</span></app-label>
                <app-input-field [(ngModel)]="user.profile.dni" placeholder="Cédula de Identidad" required></app-input-field>
              </div>
              <div>
                <app-label>Nombre <span class="text-error-500">*</span></app-label>
                <app-input-field [(ngModel)]="user.profile.name" placeholder="Nombres" required></app-input-field>
              </div>
              <div>
                <app-label>Apellido <span class="text-error-500">*</span></app-label>
                <app-input-field [(ngModel)]="user.profile.lastname" placeholder="Apellidos" required></app-input-field>
              </div>
              <div>
                <app-label>Email</app-label>
                <app-input-field [(ngModel)]="user.profile.email" placeholder="Correo Electrónico"></app-input-field>
              </div>
              <div>
                <app-label>Celular</app-label>
                <app-input-field [(ngModel)]="user.profile.cellphone" placeholder="Celular"></app-input-field>
              </div>
               <div>
                <app-label>Dirección</app-label>
                <app-input-field [(ngModel)]="user.profile.address" placeholder="Dirección"></app-input-field>
              </div>
               <div>
                <app-label>Fecha de Nacimiento</app-label>
                <app-input-field type="date" [(ngModel)]="user.profile.birthDate"></app-input-field>
              </div>
              
              <!-- Selects from Common Data -->
              <div>
                  <app-label>País <span class="text-error-500">*</span></app-label>
                  <app-select [options]="countryOptions" [(value)]="user.profile.countryId" (valueChange)="onCountryChange($event)" placeholder="Seleccionar País"></app-select>
              </div>
              <div>
                  <app-label>Ciudad <span class="text-error-500">*</span></app-label>
                  <app-select [options]="cityOptions" [(value)]="user.profile.cityId" placeholder="Seleccionar Ciudad"></app-select>
              </div>
              <div>
                  <app-label>Género <span class="text-error-500">*</span></app-label>
                  <app-select [options]="genderOptions" [(value)]="user.profile.genderTypeId" placeholder="Seleccionar Género"></app-select>
              </div>
               <div>
                  <app-label>Estado Civil <span class="text-error-500">*</span></app-label>
                  <app-select [options]="civilStatusOptions" [(value)]="user.profile.civilStatusTypeId" placeholder="Seleccionar Estado Civil"></app-select>
              </div>

            </div>
          </div>
        </div>

        <!-- Información de Cuenta -->
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 class="text-lg font-medium text-gray-800 dark:text-white">
              Cuenta de Usuario
            </h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <app-label>Usuario (Login) <span class="text-error-500">*</span></app-label>
                <app-input-field [(ngModel)]="user.username" placeholder="Nombre de usuario" [disabled]="isEditMode" required></app-input-field>
                <p *ngIf="isEditMode" class="text-xs text-gray-500 mt-1">El nombre de usuario no se puede cambiar.</p>
              </div>
              
              <div *ngIf="!isEditMode">
                <app-label>Contraseña <span class="text-error-500">*</span></app-label>
                <app-input-field type="password" [(ngModel)]="user.password" placeholder="Contraseña" required></app-input-field>
              </div>

              <div>
                <app-label>Rol <span class="text-error-500">*</span></app-label>
                <app-select [options]="roleOptions" [(value)]="user.role" placeholder="Seleccionar Rol" required></app-select>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="p-4 sm:p-6 flex justify-end gap-3">
                 <app-button variant="outline" (btnClick)="cancel()">Cancelar</app-button>
                 <app-button variant="primary" (btnClick)="save()" [disabled]="isLoading">
                    {{ isEditMode ? 'Actualizar' : 'Guardar' }}
                 </app-button>
            </div>
        </div>
      </div>
    </div>
  `
})
export class AddUserComponent implements OnInit {
  isEditMode = false;
  isLoading = false;
  userId: string | null = null;

  // Model for the form
  user: any = {
    username: '',
    password: '',
    role: null, // Role Name
    profile: {
      dni: '',
      name: '',
      lastname: '',
      email: '',
      cellphone: '',
      telephone: '',
      cellphoneReferences: '',
      address: '',
      birthDate: '', // YYYY-MM-DD
      countryId: '',
      cityId: '',
      genderTypeId: '',
      civilStatusTypeId: '',
      imageId: null
    },
    checkUniqueFields: {
      isUsernameUpdated: true,
      isDniUpdated: true
    }
  };

  // Options for selects
  countryOptions: Option[] = [];
  cityOptions: Option[] = [];
  genderOptions: Option[] = [];
  civilStatusOptions: Option[] = [];
  roleOptions: Option[] = [];

  commonData: CommonOutputDto | null = null;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;

    this.loadCommonData();
    this.loadRoles();

    if (this.isEditMode) {
      this.user.checkUniqueFields.isUsernameUpdated = false;
      this.user.checkUniqueFields.isDniUpdated = false;
      // Logic to disable unique checks unless changed, generally handled by backend if we send flag.
      // For simplicity, we assume frontend manages flags if fields change.
      this.loadUser(this.userId!);
    }
  }

  loadCommonData() {
    this.commonService.getCommonData().subscribe(data => {
      this.commonData = data;
      this.countryOptions = data.countries.map(c => ({ value: c.id, label: c.name }));
      this.genderOptions = data.genderTypes.map(g => ({ value: g.id, label: g.name }));
      this.civilStatusOptions = data.civilStatusTypes.map(cs => ({ value: cs.id, label: cs.name }));

      // Pre-select defaults if creating?
      // For now left empty.
    });
  }

  loadRoles() {
    this.roleService.getAllRoles().subscribe(roles => {
      this.roleOptions = roles.map(r => ({ value: r.name, label: r.name })); // Use Name as value per backend requirement
    });
  }

  loadUser(id: string) {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (data: UserDetails) => {
        // Map output DTO to input structure
        // Backend Output: UserDetailsOutputDto(id, username, profile, role)
        // ProfileOutputDto has names of country/city, not IDs. 
        // This is a PROBLEM. AddUserComponent needs IDs to bind to selects.
        // UserService.getUserById returns names in ProfileOutputDto.
        // We need to map names back to IDs using CommonData!

        this.user.username = data.username;
        this.user.role = data.role?.name;

        // Profile
        this.user.profile = { ...data.profile };

        // We need to wait for CommonData to be loaded to map names to IDs.
        // Or better, Update UserDetailsOutputDto to return objects with IDs or separate ID fields?
        // Existing ProfileOutputDto (Backend): country: String, city: String.
        // Solution: Find ID from CommonData based on Name.

        this.mapProfileNamesToIds(data.profile);

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        toast.error('Error al cargar usuario');
        this.isLoading = false;
      }
    });
  }

  mapProfileNamesToIds(profileOutput: any) {
    if (!this.commonData) {
      // Retry after delay or use RxJS combineLatest. For simplicity, we assume common data loads fast or we retry.
      setTimeout(() => this.mapProfileNamesToIds(profileOutput), 500);
      return;
    }

    const country = this.commonData.countries.find(c => c.name === profileOutput.country);
    if (country) {
      this.user.profile.countryId = country.id;
      this.onCountryChange(country.id); // Load cities

      const city = country.cities.find(c => c.name === profileOutput.city);
      if (city) this.user.profile.cityId = city.id;
    }

    const gender = this.commonData.genderTypes.find(g => g.name === profileOutput.gender);
    if (gender) this.user.profile.genderTypeId = gender.id;

    const civil = this.commonData.civilStatusTypes.find(c => c.name === profileOutput.civilStatus);
    if (civil) this.user.profile.civilStatusTypeId = civil.id;
  }

  onCountryChange(countryId: string) {
    const country = this.commonData?.countries.find(c => c.id === countryId);
    if (country) {
      this.cityOptions = country.cities.map(c => ({ value: c.id, label: c.name }));
    } else {
      this.cityOptions = [];
    }
  }

  save() {
    // Basic Validation
    if (!this.user.username || !this.user.role || !this.user.profile.dni) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    this.isLoading = true;
    if (this.isEditMode) {
      // On update, backend expects UpdateUserInputDto.
      // Adjust payload structure if needed.
      // UpdateUserInputDto: profile: ProfileInputDto, role: String?, checkUniqueFields...
      // Removing password if not changing? Backend 'update' takes UpdateUserInputDto which HAS password field but checks for "UUID202312" to ignore?
      // Line 295 UserService: if (userInputDto.password != "UUID202312")

      const payload = { ...this.user };
      if (!payload.password) payload.password = "UUID202312"; // Default to ignore if empty/not provided

      this.userService.updateUser(this.userId!, payload).subscribe({
        next: () => {
          toast.success('Usuario actualizado');
          this.router.navigate(['/users']);
        },
        error: (err: any) => {
          toast.error('Error al actualizar');
          this.isLoading = false;
        }
      });
    } else {
      this.userService.createUser(this.user).subscribe({
        next: () => {
          toast.success('Usuario creado');
          this.router.navigate(['/users']);
        },
        error: (err: any) => {
          toast.error('Error al crear usuario');
          this.isLoading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
