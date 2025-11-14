import { SetMetadata } from '@nestjs/common';
import { UserType as UserTypeEnum } from '@prisma/client';

export const UserType = (...userType: UserTypeEnum[]) => SetMetadata('userType', userType);
