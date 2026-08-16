import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent, Option } from '../../shared/components/form/select/select.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { PartnerService } from '../../shared/services/partner.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { AuthService } from '../../shared/services/auth.service';
import { PartnerInputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import { NumberLimitDirective } from '../../shared/directives/number-limit.directive';
import { tap, map } from 'rxjs';

@Component({
  selector: 'app-add-partner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
    NumberLimitDirective
  ],
  templateUrl: './add-partner.component.html',
  styles: ``
})
export class AddPartnerComponent implements OnInit {
  // Form fields - Campos básicos del PartnerInputDto
  fullName: string = '';
  partnerIdentificationNumber: string = '';
  phoneNumber: string = '';
  email: string = '';
  address: string = '';

  // Campos específicos de agua
  waterConnectionNumber: string = '';
  waterMeterNumber: string = '';
  connectionStatusCode: string = 'ACTIVE';
  connectionDate: string = '';
  waterConnectionAddress: string = '';
  isElderly: boolean = false;
  elderlyPaysMeetingFines: boolean = true;
  elderlyMeetingFineExplanation: string = '';
  elderlyPaysJobFines: boolean = true;
  elderlyJobFineExplanation: string = '';
  notes: string = '';

  // Cobro de instalación
  installationAmount: string | number = '';
  paymentTypeId: string = '';
  paymentTypeOptions: Option[] = [];
  openCashBalanceId: string | null = null;

  // Opciones de estado de conexión
  connectionStatusOptions: Option[] = [
    { value: 'ACTIVE', label: 'Activa' },
    { value: 'SUSPENDED', label: 'Suspendida' },
    { value: 'CUT_OFF', label: 'Cortada' },
    { value: 'INACTIVE', label: 'Pasivo' }
  ];

  // UI State
  isLoading: boolean = false;

  // Validación de número de medidor
  isCheckingMeterNumber: boolean = false;
  meterNumberExists: boolean = false;
  meterNumberCheckTimeout: any = null;

  // Modo edición
  partnerId: string | null = null;
  isEditMode: boolean = false;
  originalWaterMeterNumber: string = '';

  // Getter para verificar si el formulario es válido
  get isFormValid(): boolean {
    // Validar nombre completo (obligatorio, 2-200 caracteres, solo letras y espacios)
    if (!this.fullName || this.fullName.trim().length < 2 || this.fullName.trim().length > 200) {
      return false;
    }
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]+(\s+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(this.fullName.trim())) {
      return false;
    }

    // Validar documento de identificación (obligatorio, máximo 50 caracteres)
    if (!this.partnerIdentificationNumber || this.partnerIdentificationNumber.trim().length === 0 || this.partnerIdentificationNumber.trim().length > 50) {
      return false;
    }

    // Validar teléfono (obligatorio, máximo 20 caracteres)
    if (!this.phoneNumber || this.phoneNumber.trim().length === 0 || this.phoneNumber.trim().length > 20) {
      return false;
    }

    // Validar dirección (obligatorio, máximo 500 caracteres)
    if (!this.address || this.address.trim().length === 0 || this.address.trim().length > 500) {
      return false;
    }

    // Validar número de medidor (opcional, letras y números, máximo 50 caracteres, único)
    if (this.waterMeterNumber && this.waterMeterNumber.trim().length > 0) {
      if (this.waterMeterNumber.trim().length > 50) {
        return false;
      }
      // Permitir letras y números
      if (!/^[A-Z0-9]+$/.test(this.waterMeterNumber.trim())) {
        return false;
      }

      // SOLO bloquear si existe el número Y es distinto al original
      if (this.meterNumberExists && this.waterMeterNumber.trim().toUpperCase() !== this.originalWaterMeterNumber.trim().toUpperCase()) {
        return false;
      }
    }

    // Validar dirección de conexión (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.waterConnectionAddress && this.waterConnectionAddress.trim().length > 500) {
      return false;
    }

    // Validar notas (opcional, pero si se ingresa debe tener máximo 1000 caracteres)
    if (this.notes && this.notes.trim().length > 1000) {
      return false;
    }

    // Validar cobro de instalación (solo en modo creación)
    if (!this.isEditMode) {
      if (this.installationAmount === '') {
        return false;
      }
      const amount = typeof this.installationAmount === 'string' ? parseFloat(this.installationAmount) : this.installationAmount;
      if (isNaN(amount) || amount < 0) {
        return false;
      }
      if (!this.paymentTypeId) {
        return false;
      }
    }

    // Validar exoneraciones si es tercera edad
    if (this.isElderly) {
      if (!this.elderlyPaysMeetingFines && (!this.elderlyMeetingFineExplanation || this.elderlyMeetingFineExplanation.trim().length === 0)) {
        return false;
      }
      if (!this.elderlyPaysJobFines && (!this.elderlyJobFineExplanation || this.elderlyJobFineExplanation.trim().length === 0)) {
        return false;
      }
    }

    return true;
  }

  constructor(
    private partnerService: PartnerService,
    private cashBalanceService: CashBalanceService,
    private waterPaymentService: WaterPaymentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Establecer fecha actual por defecto (usando zona horaria local)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.connectionDate = `${year}-${month}-${day}`;
  }

  // Getter para verificar si el usuario tiene permiso para guardar
  get canSubmit(): boolean {
    return this.isFormValid && !this.isLoading;
  }

  get formattedConnectionDate(): string {
    if (!this.connectionDate || this.connectionDate.trim().length === 0) {
      return '';
    }

    // Convertir de YYYY-MM-DD a formato legible usando zona horaria local
    const parts = this.connectionDate.split('-');
    if (parts.length !== 3) {
      return this.connectionDate; // Si no es válida, devolver el valor original
    }

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Los meses en JavaScript van de 0-11
    const day = parseInt(parts[2]);

    // Crear fecha en zona horaria local
    const date = new Date(year, month, day);

    // Validar que la fecha sea válida
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return this.connectionDate; // Si no es válida, devolver el valor original
    }

    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const monthName = months[date.getMonth()];

    return `${day} de ${monthName} ${year}`;
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.partnerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.partnerId;

    if (this.isEditMode && this.partnerId) {
      this.loadPartner(this.partnerId);
    } else {
      this.loadPaymentTypes();
      this.checkOpenCashBalance();
    }
  }

  loadPaymentTypes(): void {
    // Intentar obtener tipos de pago reales
    this.cashBalanceService.getPaymentTypes().subscribe({
      next: (types: any[]) => {
        this.paymentTypeOptions = types.map((t: any) => ({ value: t.id, label: t.name }));

        // Preseleccionar "EFECTIVO" por defecto
        const efectivoType = types.find(t => t.name.toUpperCase() === 'EFECTIVO');
        if (efectivoType) {
          this.paymentTypeId = efectivoType.id;
        } else if (types.length > 0) {
          this.paymentTypeId = types[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de pago:', error);
        // Fallback en caso de error
        this.paymentTypeOptions = [
          { value: '7c6ce56e-827d-4b82-9907-73d1f3b39867', label: 'Efectivo' },
          { value: '8d7de67e-938e-5b93-0018-84e2a4c40978', label: 'Transferencia' }
        ];
      }
    });
  }

  checkOpenCashBalance(): void {
    const user = this.authService.getUserInfo();
    if (user && user.userId) {
      this.cashBalanceService.getOpenCashBalanceForUser(user.userId).subscribe({
        next: (balance: any) => {
          if (balance) {
            this.openCashBalanceId = balance.id;
          }
        }
      });
    }
  }

  loadPartner(id: string): void {
    this.isLoading = true;
    this.partnerService.getPartnerById(id).subscribe({
      next: (partner) => {
        this.fullName = partner.fullName || '';
        this.partnerIdentificationNumber = partner.partnerIdentificationNumber || '';
        this.phoneNumber = partner.phoneNumber || '';
        this.address = partner.address || '';
        this.waterMeterNumber = partner.waterMeterNumber || '';
        this.originalWaterMeterNumber = partner.waterMeterNumber || '';
        this.connectionStatusCode = partner.connectionStatusCode || 'ACTIVE';
        if (partner.connectionDate) {
          this.connectionDate = partner.connectionDate;
        }
        this.waterConnectionAddress = partner.waterConnectionAddress || '';
        this.isElderly = partner.isElderly || false;
        this.elderlyPaysMeetingFines = partner.elderlyPaysMeetingFines ?? true;
        this.elderlyMeetingFineExplanation = partner.elderlyMeetingFineExplanation || '';
        this.elderlyPaysJobFines = partner.elderlyPaysJobFines ?? true;
        this.elderlyJobFineExplanation = partner.elderlyJobFineExplanation || '';
        this.notes = partner.notes || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar socio:', error);
        toast.error('Error al cargar el socio. Por favor intenta de nuevo.');
        this.router.navigate(['/partners']);
      }
    });
  }

  onConnectionStatusChange(value: string): void {
    this.connectionStatusCode = value;
  }

  validateForm(): boolean {
    // Validar nombre completo (obligatorio, 2-200 caracteres, solo letras y espacios)
    if (!this.fullName || this.fullName.trim().length < 2) {
      toast.error('El nombre completo es obligatorio y debe tener al menos 2 caracteres');
      return false;
    }
    if (this.fullName.trim().length > 200) {
      toast.error('El nombre completo no puede exceder 200 caracteres');
      return false;
    }
    // Validar que solo contenga letras y espacios (ya se filtra en tiempo real, pero validamos por si acaso)
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]+(\s+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(this.fullName.trim())) {
      toast.error('El nombre completo solo puede contener letras, números y un espacio entre palabras');
      return false;
    }

    // Validar documento de identificación (obligatorio, máximo 50 caracteres)
    if (!this.partnerIdentificationNumber || this.partnerIdentificationNumber.trim().length === 0) {
      toast.error('El documento de identificación es obligatorio');
      return false;
    }
    if (this.partnerIdentificationNumber.trim().length > 50) {
      toast.error('El documento de identificación no puede exceder 50 caracteres');
      return false;
    }

    // Validar teléfono (obligatorio, máximo 20 caracteres)
    if (!this.phoneNumber || this.phoneNumber.trim().length === 0) {
      toast.error('El número de celular es obligatorio');
      return false;
    }
    if (this.phoneNumber.trim().length > 20) {
      toast.error('El celular no puede exceder 20 caracteres');
      return false;
    }

    // Validar dirección (obligatorio, máximo 500 caracteres)
    if (!this.address || this.address.trim().length === 0) {
      toast.error('La dirección es obligatoria');
      return false;
    }
    if (this.address.trim().length > 500) {
      toast.error('La dirección no puede exceder 500 caracteres');
      return false;
    }

    // Validar identificador de medidor (opcional, letras y números, máximo 50 caracteres, único)
    if (this.waterMeterNumber && this.waterMeterNumber.trim().length > 0) {
      if (this.waterMeterNumber.trim().length > 50) {
        toast.error('El identificador de medidor no puede exceder 50 caracteres');
        return false;
      }
      // Validar que solo contenga letras y números (ya está en mayúsculas)
      if (!/^[A-Z0-9]+$/.test(this.waterMeterNumber.trim())) {
        toast.error('El identificador de medidor solo puede contener letras y números');
        return false;
      }
      // Validar unicidad
      if (this.meterNumberExists) {
        toast.error('El identificador de medidor ya está registrado para otro socio');
        return false;
      }
    }

    // Validar dirección de conexión (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.waterConnectionAddress && this.waterConnectionAddress.trim().length > 500) {
      toast.error('La dirección de conexión no puede exceder 500 caracteres');
      return false;
    }

    // Validar cobro de instalación (solo en modo creación)
    if (!this.isEditMode) {
      if (this.installationAmount === '') {
        toast.error('El monto de instalación es obligatorio');
        return false;
      }
      const amount = typeof this.installationAmount === 'string' ? parseFloat(this.installationAmount) : this.installationAmount;
      if (isNaN(amount) || amount < 0) {
        toast.error('El monto de instalación debe ser mayor o igual a 0');
        return false;
      }
      if (!this.paymentTypeId) {
        toast.error('El tipo de pago es obligatorio');
        return false;
      }
    }

    // Validar exoneraciones si es tercera edad
    if (this.isElderly) {
      if (!this.elderlyPaysMeetingFines && (!this.elderlyMeetingFineExplanation || this.elderlyMeetingFineExplanation.trim().length === 0)) {
        toast.error('Debe ingresar un motivo para la exoneración de reuniones');
        return false;
      }
      if (!this.elderlyPaysJobFines && (!this.elderlyJobFineExplanation || this.elderlyJobFineExplanation.trim().length === 0)) {
        toast.error('Debe ingresar un motivo para la exoneración de trabajos');
        return false;
      }
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    // Basic partner info (used for both CREATE and UPDATE)
    const partnerDTO: any = {
      fullName: this.fullName.trim().toUpperCase(),
      partnerIdentificationNumber: this.partnerIdentificationNumber?.trim() || undefined,
      cellphone: this.phoneNumber?.trim() || undefined,
      address: this.address?.trim() || undefined,
      waterMeterNumber: this.waterMeterNumber?.trim().toUpperCase() || undefined,
      connectionStatusCode: this.connectionStatusCode || undefined,
      connectionDate: this.connectionDate || undefined,
      waterConnectionAddress: this.waterConnectionAddress?.trim() || undefined,
      isElderly: this.isElderly,
      elderlyPaysMeetingFines: this.isElderly ? this.elderlyPaysMeetingFines : true,
      elderlyMeetingFineExplanation: (this.isElderly && !this.elderlyPaysMeetingFines) ? this.elderlyMeetingFineExplanation?.trim() || undefined : undefined,
      elderlyPaysJobFines: this.isElderly ? this.elderlyPaysJobFines : true,
      elderlyJobFineExplanation: (this.isElderly && !this.elderlyPaysJobFines) ? this.elderlyJobFineExplanation?.trim() || undefined : undefined,
      notes: this.notes?.trim() || undefined
    };

    if (this.isEditMode && this.partnerId) {
      // Actualizar socio existente - SOLO enviar datos básicos
      this.partnerService.updatePartner(this.partnerId, partnerDTO).subscribe({
        next: (response) => {
          this.isLoading = false;
          toast.success('Socio actualizado exitosamente');
          this.router.navigate(['/partners']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al actualizar socio:', error);

          let userMessage = '';

          if (error.status === 0) {
            userMessage = 'No se puede conectar al servidor.';
          } else if (error.status === 401) {
            userMessage = 'Se requiere autenticación. Por favor inicia sesión primero.';
          } else if (error.status === 403) {
            userMessage = 'No tienes permisos para actualizar socios.';
          } else if (error.status === 404) {
            userMessage = error.error || 'Socio o estado de conexión no encontrado.';
          } else if (error.status === 400) {
            userMessage = (typeof error.error === 'string' ? error.error : error.error?.message) || 'Datos inválidos: Verifica los datos ingresados';
          } else if (error.status === 422) {
            userMessage = `Error de validación: ${(typeof error.error === 'string' ? error.error : error.error?.message) || 'Revisa los campos del formulario'}`;
          } else if (error.status === 500) {
            userMessage = 'Error interno del servidor. Contacta al administrador.';
          } else {
            userMessage = (typeof error.error === 'string' ? error.error : error.error?.message) || `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
          }

          toast.error(userMessage);
        }
      });
    } else {
      // Crear nuevo socio - Incluir datos de instalación
      const createPayload = {
        ...partnerDTO,
        installationAmount: this.installationAmount !== '' ? (typeof this.installationAmount === 'string' ? parseFloat(this.installationAmount) : this.installationAmount) : 0,
        paymentTypeId: this.paymentTypeId || undefined,
        cashBalanceId: this.openCashBalanceId || undefined,
        userId: this.authService.getUserInfo()?.userId || undefined
      };

      this.partnerService.createPartner(createPayload).subscribe({
        next: (response) => {
          this.isLoading = false;
          toast.success('Socio creado exitosamente');

          // Si se registró un pago de instalación, imprimir el recibo automáticamente
          if (response.lastPaymentId) {
            toast.info('Generando comprobante de instalación...');
            this.waterPaymentService.downloadReceiptPdf(response.lastPaymentId).then(() => {
              this.router.navigate(['/partners']);
            }).catch(err => {
              console.error('Error al imprimir comprobante de instalación:', err);
              this.router.navigate(['/partners']);
            });
          } else {
            this.router.navigate(['/partners']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al crear partner:', error);

          let userMessage = '';

          if (error.status === 0) {
            userMessage = 'No se puede conectar al servidor.';
          } else if (error.status === 401) {
            userMessage = 'Se requiere autenticación. Por favor inicia sesión primero.';
          } else if (error.status === 403) {
            userMessage = 'No tienes permisos para crear partners.';
          } else if (error.status === 404) {
            userMessage = error.error || 'Recurso no encontrado.';
          } else if (error.status === 400) {
            userMessage = (typeof error.error === 'string' ? error.error : error.error?.message) || 'Datos inválidos: Verifica los datos ingresados';
          } else if (error.status === 422) {
            userMessage = `Error de validación: ${(typeof error.error === 'string' ? error.error : error.error?.message) || 'Revisa los campos del formulario'}`;
          } else if (error.status === 500) {
            userMessage = 'Error interno del servidor. Contacta al administrador.';
          } else {
            userMessage = (typeof error.error === 'string' ? error.error : error.error?.message) || `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
          }

          toast.error(userMessage);
        }
      });
    }
  }



  onSaveDraft(): void {
    toast.info('Funcionalidad de borrador no implementada');
  }

  resetForm(): void {
    this.fullName = '';
    this.partnerIdentificationNumber = '';
    this.phoneNumber = '';
    this.email = '';
    this.address = '';
    this.waterConnectionNumber = '';
    this.waterMeterNumber = '';
    this.connectionStatusCode = 'ACTIVE';
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.connectionDate = `${year}-${month}-${day}`;
    this.waterConnectionAddress = '';
    this.isElderly = false;
    this.elderlyPaysMeetingFines = true;
    this.elderlyMeetingFineExplanation = '';
    this.elderlyPaysJobFines = true;
    this.elderlyJobFineExplanation = '';
    this.notes = '';
  }

  goBack(): void {
    this.router.navigate(['/partners']);
  }

  onWaterMeterNumberChange(value: string | number): void {
    // Permitir letras y números, convertir a mayúsculas
    let stringValue = String(value || '');
    // Solo permitir letras y números
    stringValue = stringValue.replace(/[^A-Za-z0-9]/g, '');
    // Convertir a mayúsculas
    const filteredValue = stringValue.toUpperCase();
    this.waterMeterNumber = filteredValue;

    // Limpiar timeout anterior si existe
    if (this.meterNumberCheckTimeout) {
      clearTimeout(this.meterNumberCheckTimeout);
    }

    // Resetear estado de validación
    this.meterNumberExists = false;

    // Validar unicidad después de 500ms de inactividad (debounce)
    if (filteredValue && filteredValue.trim().length > 0 && /^[A-Z0-9]+$/.test(filteredValue.trim())) {
      this.meterNumberCheckTimeout = setTimeout(() => {
        this.checkMeterNumberUniqueness(filteredValue.trim());
      }, 500);
    }
  }

  checkMeterNumberUniqueness(meterNumber: string): void {
    if (!meterNumber || meterNumber.trim().length === 0) {
      this.meterNumberExists = false;
      return;
    }

    this.isCheckingMeterNumber = true;
    // En modo edición, excluir el socio actual de la verificación
    const excludePartnerId = this.isEditMode && this.partnerId ? this.partnerId : undefined;
    this.partnerService.checkWaterMeterNumberExists(meterNumber, excludePartnerId).subscribe({
      next: (response) => {
        this.meterNumberExists = response.exists;
        this.isCheckingMeterNumber = false;
        if (response.exists) {
          toast.error('El identificador de medidor ya está registrado para otro socio');
        }
      },
      error: (error) => {
        console.error('Error al verificar identificador de medidor:', error);
        this.isCheckingMeterNumber = false;
        // En caso de error, no bloqueamos el formulario pero mostramos un mensaje
        if (error.status === 400 || error.status === 409) {
          this.meterNumberExists = true;
          toast.error('El identificador de medidor ya está registrado para otro socio');
        }
      }
    });
  }

  onPartnerIdentificationNumberInput(event: any): void {
    // Eliminar espacios al inicio y final
    let value = event.target.value;
    // Eliminar espacios al inicio
    value = value.replace(/^\s+/, '');
    // Eliminar espacios al final (esto se maneja mejor en el blur, pero lo hacemos aquí también)
    value = value.replace(/\s+$/, '');

    // Actualizar el modelo y el input
    this.partnerIdentificationNumber = value;
    event.target.value = value;
  }

  onPartnerIdentificationNumberBlur(): void {
    // Al perder el foco, eliminar espacios al inicio y final definitivamente
    if (this.partnerIdentificationNumber) {
      this.partnerIdentificationNumber = this.partnerIdentificationNumber.trim();
    }
  }

  onPhoneNumberChange(value: string | number): void {
    // Solo permitir números
    const stringValue = String(value || '');
    const filteredValue = stringValue.replace(/[^0-9]/g, '');
    this.phoneNumber = filteredValue;
  }

  onFullNameInput(event: any): void {
    // Solo permitir letras, números y espacios
    let value = event.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

    // Reemplazar múltiples espacios consecutivos por un solo espacio
    value = value.replace(/\s+/g, ' ');

    // Eliminar espacios al inicio
    value = value.replace(/^\s+/, '');

    // Convertir a mayúsculas
    value = value.toUpperCase();

    // Actualizar el modelo y el input
    this.fullName = value;
    event.target.value = value;
  }

  onInstallationAmountChange(value: any): void {
    this.installationAmount = value;
  }

}

