import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingConfigService } from '../../shared/services/billing-config.service';
import { BillingConfigOutputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
    selector: 'app-billing-config',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './billing-config.component.html'
})
export class BillingConfigComponent implements OnInit {
    configs: BillingConfigOutputDto[] = [];
    isLoading = false;
    isSaving = false;

    // Form values
    aporteDeporte = 0;
    aporteOTB = 0;
    tarifaBasica = 0;
    multaExcesoM3 = 0;
    multaCorte = 50;
    mantenimientoSuspendida = 5;
    multaRetrasoAull = 5;
    multaRetrasoClasico = 5;
    multaConexionPasiva = 5;

    constructor(private billingConfigService: BillingConfigService) { }

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs(): void {
        this.isLoading = true;
        this.billingConfigService.getAllConfigs().subscribe({
            next: (configs) => {
                this.configs = configs;
                this.populateFormValues();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading configs:', error);
                toast.error('Error al cargar configuraciones');
                this.isLoading = false;
            }
        });
    }

    populateFormValues(): void {
        this.configs.forEach(config => {
            switch (config.configKey) {
                case 'APORTE_DEPORTE':
                    this.aporteDeporte = config.configValue;
                    break;
                case 'APORTE_OTB':
                    this.aporteOTB = config.configValue;
                    break;
                case 'TARIFA_BASICA':
                    this.tarifaBasica = config.configValue;
                    break;
                case 'MULTA_EXCESO_M3':
                    this.multaExcesoM3 = config.configValue;
                    break;
                case 'MULTA_CORTE':
                    this.multaCorte = config.configValue;
                    break;
                case 'MANTENIMIENTO_SUSPENDIDA':
                    this.mantenimientoSuspendida = config.configValue;
                    break;
                case 'MULTA_RETRASO_AULL':
                    this.multaRetrasoAull = config.configValue;
                    break;
                case 'MULTA_RETRASO_CLASICO':
                    this.multaRetrasoClasico = config.configValue;
                    break;
                case 'MULTA_CONEXION_PASIVA':
                    this.multaConexionPasiva = config.configValue;
                    break;
            }
        });
    }

    saveConfigs(): void {
        if (this.aporteDeporte < 0 || this.aporteOTB < 0 || this.tarifaBasica < 0 ||
            this.multaExcesoM3 < 0 || this.multaCorte < 0 || this.mantenimientoSuspendida < 0 ||
            this.multaRetrasoAull < 0 || this.multaRetrasoClasico < 0 || this.multaConexionPasiva < 0) {
            toast.error('Todos los valores deben ser mayores o iguales a cero');
            return;
        }

        this.isSaving = true;
        const updates = [
            this.billingConfigService.updateConfig('APORTE_DEPORTE', this.aporteDeporte),
            this.billingConfigService.updateConfig('APORTE_OTB', this.aporteOTB),
            this.billingConfigService.updateConfig('TARIFA_BASICA', this.tarifaBasica),
            this.billingConfigService.updateConfig('MULTA_EXCESO_M3', this.multaExcesoM3),
            this.billingConfigService.updateConfig('MULTA_CORTE', this.multaCorte),
            this.billingConfigService.updateConfig('MANTENIMIENTO_SUSPENDIDA', this.mantenimientoSuspendida),
            this.billingConfigService.updateConfig('MULTA_RETRASO_AULL', this.multaRetrasoAull),
            this.billingConfigService.updateConfig('MULTA_RETRASO_CLASICO', this.multaRetrasoClasico),
            this.billingConfigService.updateConfig('MULTA_CONEXION_PASIVA', this.multaConexionPasiva)
        ];

        // Execute all updates
        Promise.all(updates.map(obs => obs.toPromise()))
            .then(() => {
                toast.success('Configuración actualizada correctamente');
                this.loadConfigs(); // Reload to confirm
                this.isSaving = false;
            })
            .catch((error) => {
                console.error('Error saving configs:', error);
                toast.error('Error al guardar configuración');
                this.isSaving = false;
            });
    }

    resetForm(): void {
        this.aporteDeporte = 2;
        this.aporteOTB = 3;
        this.tarifaBasica = 15;
        this.multaExcesoM3 = 5;
        this.multaCorte = 50;
        this.mantenimientoSuspendida = 5;
        this.multaRetrasoAull = 5;
        this.multaRetrasoClasico = 5;
        this.multaConexionPasiva = 5;

        toast.info('Valores restablecidos a su configuración original');
    }

    validateInputs(): boolean {
        return this.aporteDeporte >= 0 &&
            this.aporteOTB >= 0 &&
            this.tarifaBasica >= 0 &&
            this.multaExcesoM3 >= 0 &&
            this.multaCorte >= 0 &&
            this.mantenimientoSuspendida >= 0 &&
            this.multaRetrasoAull >= 0 &&
            this.multaRetrasoClasico >= 0 &&
            this.multaConexionPasiva >= 0;
    }
}
