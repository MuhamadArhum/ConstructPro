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
    example: ['permission-uuid-1', 'permission-uuid-2'],
    description: 'Array of permission IDs to assign to the role',
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
