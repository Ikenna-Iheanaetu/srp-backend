import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidId', async: false })
export class IsValidIdConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid identifier format';
  }
}
