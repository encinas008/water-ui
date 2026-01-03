import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-field',
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative flex items-center">
      <input
        [type]="isPasswordVisible ? 'text' : type"
        [id]="id"
        [name]="name"
        [placeholder]="placeholder"
        [value]="value"
        [min]="min"
        [max]="max"
        [step]="step"
        [disabled]="disabled"
        [readonly]="readonly"
        [ngClass]="inputClasses"
        (input)="onInput($event)"
        (blur)="onTouched()"
        (keydown.enter)="onKeydownEnter($event)"
      />

      <button
        *ngIf="type === 'password' && allowPasswordToggle"
        type="button"
        (click)="isPasswordVisible = !isPasswordVisible"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none dark:hover:text-white"
      >
        <!-- Eye Open (Show password) -->
        <svg *ngIf="!isPasswordVisible" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <!-- Eye Slashed (Hide password) -->
        <svg *ngIf="isPasswordVisible" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.173 5.173m13.653 13.653l-3.946-3.947m1.587-1.587A9.956 9.956 0 0021.542 12c-1.274-4.057-5.064-7-9.542-7-1.274 0-2.483.214-3.607.608L5.173 5.173" />
        </svg>
      </button>

      @if (hint) {
      <p class="mt-1.5 text-xs"
        [ngClass]="{
          'text-error-500': error,
          'text-success-500': success,
          'text-gray-500': !error && !success
        }">
        {{ hint }}
      </p>
      }
    </div>
  `,
})
export class InputFieldComponent implements ControlValueAccessor {

  @Input() type: string = 'text';
  @Input() id?: string = '';
  @Input() name?: string = '';
  @Input() placeholder?: string = '';
  @Input() value: string | number = '';
  @Input() min?: string | number;
  @Input() max?: string | number;
  @Input() step?: number;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() hint?: string;
  @Input() className: string = '';
  @Input() allowPasswordToggle: boolean = false;

  isPasswordVisible: boolean = false;

  @Output() valueChange = new EventEmitter<string | number>();
  @Output() keydownEnter = new EventEmitter<KeyboardEvent>();

  // ControlValueAccessor implementation
  private onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get inputClasses(): string {
    let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${this.className}`;

    if (this.disabled) {
      inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-40`;
    } else if (this.readonly) {
      inputClasses += ` text-gray-500 border-gray-300 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (this.error) {
      inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    } else if (this.success) {
      inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
    } else {
      inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
    }
    return inputClasses;
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = this.type === 'number' ? +input.value : input.value;
    this.value = newValue;
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  onKeydownEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    this.keydownEnter.emit(keyboardEvent);
  }
}
