import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent, Option } from '../../shared/components/form/select/select.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { PartnerService } from '../../shared/services/partner.service';
import { PartnerInputDto } from '../../shared/models/water-system.models';

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
    ButtonComponent
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
  notes: string = '';

  // Opciones de estado de conexión
  connectionStatusOptions: Option[] = [
    { value: 'ACTIVE', label: 'Activa' },
    { value: 'SUSPENDED', label: 'Suspendida' },
    { value: 'CUT_OFF', label: 'Cortada' },
    { value: 'INACTIVE', label: 'Inactiva' }
  ];

  // UI State
  isLoading: boolean = false;
  showAlert: boolean = false;
  alertType: 'success' | 'error' | 'warning' | 'info' = 'success';
  alertMessage: string = '';
  
  // Validación de número de medidor
  isCheckingMeterNumber: boolean = false;
  meterNumberExists: boolean = false;
  meterNumberCheckTimeout: any = null;

  // Getter para verificar si el formulario es válido
  get isFormValid(): boolean {
    // Validar nombre completo (obligatorio, 2-200 caracteres, solo letras y espacios)
    if (!this.fullName || this.fullName.trim().length < 2 || this.fullName.trim().length > 200) {
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(\s+[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(this.fullName.trim())) {
      return false;
    }

    // Validar documento de identificación (opcional, pero si se ingresa debe tener máximo 50 caracteres)
    if (this.partnerIdentificationNumber && this.partnerIdentificationNumber.trim().length > 50) {
      return false;
    }

    // Validar teléfono (opcional, pero si se ingresa debe tener máximo 20 caracteres)
    if (this.phoneNumber && this.phoneNumber.trim().length > 20) {
      return false;
    }

    // Validar dirección (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.address && this.address.trim().length > 500) {
      return false;
    }

    // Validar número de medidor (obligatorio, solo números, mínimo 6 dígitos, máximo 50 caracteres, único)
    if (!this.waterMeterNumber || this.waterMeterNumber.trim().length === 0) {
      return false;
    }
    if (this.waterMeterNumber.trim().length < 6) {
      return false;
    }
    if (this.waterMeterNumber.trim().length > 50) {
      return false;
    }
    if (!/^[0-9]+$/.test(this.waterMeterNumber.trim())) {
      return false;
    }
    if (this.meterNumberExists) {
      return false;
    }

    // Validar dirección de conexión (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.waterConnectionAddress && this.waterConnectionAddress.trim().length > 500) {
      return false;
    }

    // Validar notas (opcional, pero si se ingresa debe tener máximo 1000 caracteres)
    if (this.notes && this.notes.trim().length > 1000) {
      return false;
    }

    return true;
  }

  constructor(
    private partnerService: PartnerService,
    private router: Router
  ) {
    // Establecer fecha actual por defecto (usando zona horaria local)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.connectionDate = `${year}-${month}-${day}`;
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
    // No necesitamos cargar datos comunes
  }

  onConnectionStatusChange(value: string): void {
    this.connectionStatusCode = value;
  }

  validateForm(): boolean {
    // Validar nombre completo (obligatorio, 2-200 caracteres, solo letras y espacios)
    if (!this.fullName || this.fullName.trim().length < 2) {
      this.showAlertMessage('El nombre completo es obligatorio y debe tener al menos 2 caracteres', 'error');
      return false;
    }
    if (this.fullName.trim().length > 200) {
      this.showAlertMessage('El nombre completo no puede exceder 200 caracteres', 'error');
      return false;
    }
    // Validar que solo contenga letras y espacios (ya se filtra en tiempo real, pero validamos por si acaso)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(\s+[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(this.fullName.trim())) {
      this.showAlertMessage('El nombre completo solo puede contener letras y un espacio entre palabras', 'error');
      return false;
    }

    // Validar documento de identificación (opcional, pero si se ingresa debe tener máximo 50 caracteres)
    if (this.partnerIdentificationNumber && this.partnerIdentificationNumber.trim().length > 0) {
      if (this.partnerIdentificationNumber.trim().length > 50) {
        this.showAlertMessage('El documento de identificación no puede exceder 50 caracteres', 'error');
        return false;
      }
    }

    // Validar teléfono (opcional, pero si se ingresa debe tener máximo 20 caracteres)
    if (this.phoneNumber && this.phoneNumber.trim().length > 0) {
      if (this.phoneNumber.trim().length > 20) {
        this.showAlertMessage('El teléfono no puede exceder 20 caracteres', 'error');
        return false;
      }
    }

    // Validar dirección (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.address && this.address.trim().length > 500) {
      this.showAlertMessage('La dirección no puede exceder 500 caracteres', 'error');
      return false;
    }

    // Validar número de medidor (obligatorio, solo números, mínimo 6 dígitos, máximo 50 caracteres, único)
    if (!this.waterMeterNumber || this.waterMeterNumber.trim().length === 0) {
      this.showAlertMessage('El número de medidor es obligatorio', 'error');
      return false;
    }
    if (this.waterMeterNumber.trim().length < 6) {
      this.showAlertMessage('El número de medidor debe tener al menos 6 dígitos', 'error');
      return false;
    }
    if (this.waterMeterNumber.trim().length > 50) {
      this.showAlertMessage('El número de medidor no puede exceder 50 caracteres', 'error');
      return false;
    }
    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(this.waterMeterNumber.trim())) {
      this.showAlertMessage('El número de medidor solo puede contener números', 'error');
      return false;
    }
    // Validar unicidad
    if (this.meterNumberExists) {
      this.showAlertMessage('El número de medidor ya está registrado para otro socio', 'error');
      return false;
    }

    // Validar dirección de conexión (opcional, pero si se ingresa debe tener máximo 500 caracteres)
    if (this.waterConnectionAddress && this.waterConnectionAddress.trim().length > 500) {
      this.showAlertMessage('La dirección de conexión no puede exceder 500 caracteres', 'error');
      return false;
    }

    // Validar notas (opcional, pero si se ingresa debe tener máximo 1000 caracteres)
    if (this.notes && this.notes.trim().length > 1000) {
      this.showAlertMessage('Las notas no pueden exceder 1000 caracteres', 'error');
      return false;
    }


    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    // Mapear al formato que espera el backend (cellphone en lugar de phoneNumber)
    // Convertir nombre completo a mayúsculas
    const partnerInput: any = {
      fullName: this.fullName.trim().toUpperCase(),
      partnerIdentificationNumber: this.partnerIdentificationNumber?.trim() || undefined,
      cellphone: this.phoneNumber?.trim() || "",
      address: this.address?.trim() || "",
      waterMeterNumber: this.waterMeterNumber?.trim() || undefined,
      connectionStatusCode: this.connectionStatusCode || undefined,
      connectionDate: this.connectionDate || undefined,
      waterConnectionAddress: this.waterConnectionAddress?.trim() || undefined,
      isElderly: this.isElderly,
      notes: this.notes?.trim() || ""
    };

    this.partnerService.createPartner(partnerInput).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showAlertMessage('Partner creado exitosamente', 'success');
        
        // Resetear formulario después de 2 segundos
        setTimeout(() => {
          this.resetForm();
        }, 2000);
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
          userMessage = 'Recurso no encontrado.';
        } else if (error.status === 400) {
          userMessage = `Datos inválidos: ${error.error?.message || 'Verifica los datos ingresados'}`;
        } else if (error.status === 422) {
          userMessage = `Error de validación: ${error.error?.message || 'Revisa los campos del formulario'}`;
        } else if (error.status === 500) {
          userMessage = 'Error interno del servidor. Contacta al administrador.';
        } else {
          userMessage = `Error ${error.status}: ${error.error?.message || error.statusText || 'Error desconocido'}`;
        }
        
        this.showAlertMessage(userMessage, 'error');
      }
    });
  }

  onSaveDraft(): void {
    this.showAlertMessage('Funcionalidad de borrador no implementada', 'info');
  }

  resetForm(): void {
    this.fullName = '';
    this.partnerIdentificationNumber = '';
    this.phoneNumber = '';
    this.address = '';
    this.waterMeterNumber = '';
    this.connectionStatusCode = 'ACTIVE';
    // Establecer fecha actual por defecto (usando zona horaria local)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.connectionDate = `${year}-${month}-${day}`;
    this.waterConnectionAddress = '';
    this.isElderly = false;
    this.notes = '';
    this.showAlert = false;
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  onWaterMeterNumberChange(value: string | number): void {
    // Solo permitir números
    const stringValue = String(value || '');
    const filteredValue = stringValue.replace(/[^0-9]/g, '');
    this.waterMeterNumber = filteredValue;
    
    // Limpiar timeout anterior si existe
    if (this.meterNumberCheckTimeout) {
      clearTimeout(this.meterNumberCheckTimeout);
    }
    
    // Resetear estado de validación
    this.meterNumberExists = false;
    
    // Validar unicidad después de 500ms de inactividad (debounce)
    if (filteredValue && filteredValue.trim().length > 0 && /^[0-9]+$/.test(filteredValue.trim())) {
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
    this.partnerService.checkWaterMeterNumberExists(meterNumber).subscribe({
      next: (response) => {
        this.meterNumberExists = response.exists;
        this.isCheckingMeterNumber = false;
        if (response.exists) {
          this.showAlertMessage('El número de medidor ya está registrado para otro socio', 'error');
        }
      },
      error: (error) => {
        console.error('Error al verificar número de medidor:', error);
        this.isCheckingMeterNumber = false;
        // En caso de error, no bloqueamos el formulario pero mostramos un mensaje
        if (error.status === 400 || error.status === 409) {
          this.meterNumberExists = true;
          this.showAlertMessage('El número de medidor ya está registrado para otro socio', 'error');
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
    // Solo permitir letras y espacios
    let value = event.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    
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

}

