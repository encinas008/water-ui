import { Directive, HostListener, Input, Optional } from '@angular/core';
import { InputFieldComponent } from '../components/form/input/input-field.component';

@Directive({
    selector: 'app-input-field[appNumberLimit]',
    standalone: true
})
export class NumberLimitDirective {
    @Input() maxLimit: number = 9999999.99;
    @Input() minLimit: number = 1.00;
    @Input() decimals: number = 2;

    constructor(
        @Optional() private inputField: InputFieldComponent
    ) { }

    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (!this.inputField) return;

        const input = (event.target as HTMLInputElement);
        const value = input.value;
        const key = event.key;

        // Permitir teclas de control: Backspace, Delete, Tab, Escape, Enter, flechas, etc.
        const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (controlKeys.indexOf(key) !== -1 || (event.ctrlKey || event.metaKey)) {
            return;
        }

        // Ya hay un punto decimal y se intenta escribir otro
        if (key === '.' && value.includes('.')) {
            event.preventDefault();
            return;
        }

        // No permitir caracteres que no sean números o punto
        if (!/^[0-9.]$/.test(key)) {
            event.preventDefault();
            return;
        }

        // Validar decimales
        if (value.includes('.')) {
            const parts = value.split('.');
            const selectionStart = input.selectionStart ?? 0;
            const dotIndex = value.indexOf('.');

            // Si el cursor está después del punto y ya alcanzamos el límite de decimales
            if (selectionStart > dotIndex && parts[1].length >= this.decimals) {
                // Solo bloquear si no hay texto seleccionado (si hay selección, se va a reemplazar)
                if (input.selectionStart === input.selectionEnd) {
                    event.preventDefault();
                }
            }
        }
    }

    @HostListener('valueChange', ['$event'])
    onValueChange(value: any) {
        if (!this.inputField || value === null || value === undefined) return;

        let stringValue = value.toString();

        // 1. Limpieza básica
        stringValue = stringValue.replace(/[^0-9.]/g, '');
        const parts = stringValue.split('.');
        if (parts.length > 2) {
            stringValue = parts[0] + '.' + parts.slice(1).join('');
        }

        // 2. Truncar decimales
        if (parts.length === 2 && parts[1].length > this.decimals) {
            stringValue = parts[0] + '.' + parts[1].substring(0, this.decimals);
        }

        // 3. Limitar al máximo absoluto
        const numValue = parseFloat(stringValue);
        if (!isNaN(numValue) && numValue > this.maxLimit) {
            stringValue = this.maxLimit.toString();
        }

        // 4. Sincronización crítica con el componente y el modelo original
        if (stringValue !== value.toString()) {
            this.inputField.value = stringValue;
            // Notificar al componente que el valor ha cambiado después de nuestra limpieza
            // para que el ngModel/FormControl se actualice.
            this.inputField.valueChange.emit(stringValue);
        }
    }

    @HostListener('blur')
    onBlur() {
        if (!this.inputField) return;

        const value = this.inputField.value;
        let numValue = parseFloat(value.toString());

        if (isNaN(numValue)) {
            numValue = this.minLimit;
        } else if (numValue < this.minLimit) {
            numValue = this.minLimit;
        } else if (numValue > this.maxLimit) {
            numValue = this.maxLimit;
        }

        const formattedValue = numValue.toFixed(this.decimals);

        if (formattedValue !== value.toString()) {
            this.inputField.value = formattedValue;
            this.inputField.valueChange.emit(formattedValue);
        }
    }
}
