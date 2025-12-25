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

  constructor(
    private partnerService: PartnerService,
    private router: Router
  ) {
    // Establecer fecha actual por defecto
    const today = new Date();
    this.connectionDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // No necesitamos cargar datos comunes
  }

  onConnectionStatusChange(value: string): void {
    this.connectionStatusCode = value;
  }

  validateForm(): boolean {
    if (!this.fullName || !this.partnerIdentificationNumber) {
      this.showAlertMessage('Por favor complete el nombre completo y documento de identificación', 'error');
      return false;
    }

    if (!this.email) {
      this.showAlertMessage('Por favor complete el email', 'error');
      return false;
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlertMessage('Por favor ingrese un email válido', 'error');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const partnerInput: PartnerInputDto = {
      fullName: this.fullName,
      partnerIdentificationNumber: this.partnerIdentificationNumber,
      phoneNumber: this.phoneNumber || undefined,
      email: this.email,
      address: this.address || undefined,
      waterConnectionNumber: this.waterConnectionNumber || undefined,
      waterMeterNumber: this.waterMeterNumber || undefined,
      connectionStatusCode: this.connectionStatusCode,
      connectionDate: this.connectionDate || undefined,
      waterConnectionAddress: this.waterConnectionAddress || undefined,
      notes: this.notes || undefined
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
    this.email = '';
    this.address = '';
    this.waterConnectionNumber = '';
    this.waterMeterNumber = '';
    this.connectionStatusCode = 'ACTIVE';
    const today = new Date();
    this.connectionDate = today.toISOString().split('T')[0];
    this.waterConnectionAddress = '';
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
}

