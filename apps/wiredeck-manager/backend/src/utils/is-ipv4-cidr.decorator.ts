import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsIPv4Cidr', async: false })
export class IsIPv4CidrConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;

    const parts = value.split('/');
    if (parts.length !== 2) return false;

    const [ip, prefix] = parts;

    // Validate IPv4 address
    const ipRegex = /^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
    if (!ipRegex.test(ip)) return false;

    // Validate prefix length (0–32, no leading zeros)
    const prefixNum = Number(prefix);
    if (
      !/^\d+$/.test(prefix) || // must be digits only
      prefixNum < 0 ||
      prefixNum > 32
    )
      return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return '$property must be a valid IPv4 CIDR notation (e.g. 192.168.0.1/24)';
  }
}

export function IsIPv4Cidr(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIPv4CidrConstraint,
    });
  };
}
