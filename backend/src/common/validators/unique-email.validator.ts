import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Custom validator constraint to check if email is unique
 *
 * This validator queries the database to check if the email already exists.
 * It's used during registration to provide a friendly error message instead
 * of a database constraint violation error.
 */
@ValidatorConstraint({ async: true, name: 'isEmailUnique' })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validate(email: string): Promise<boolean> {
    if (!email) {
      return true; // Let @IsEmail() handle empty validation
    }

    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    return !user; // Return true if email doesn't exist (is unique)
  }

  defaultMessage(): string {
    return 'Email already exists';
  }
}

/**
 * Decorator to validate that an email is unique in the database
 *
 * @example
 * ```typescript
 * @IsEmail()
 * @IsEmailUnique()
 * email: string;
 * ```
 */
export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}
