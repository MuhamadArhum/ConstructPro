import { IsString, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Project Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['Roles.View', 'Roles.Create'],
    description: 'Array of permission codes to assign to the role',
  })
  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}
