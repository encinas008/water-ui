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
  templateUrl: './add-user.component.html',
  styles: ``
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
  confirmPassword = '';

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
    this.roleService.getAll().subscribe(roles => {
      this.roleOptions = roles.map(r => ({ value: r.name, label: r.name }));
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

    if (!this.isEditMode && (!this.user.password || !this.confirmPassword)) {
      toast.error('La contraseña y su confirmación son obligatorias');
      return;
    }

    if (!this.isEditMode && (this.user.password !== this.confirmPassword)) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Enforce Uppercase
    this.user.profile.name = this.user.profile.name?.toUpperCase();
    this.user.profile.lastname = this.user.profile.lastname?.toUpperCase();

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
