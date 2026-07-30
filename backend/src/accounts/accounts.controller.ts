import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountQueryDto,
  CreateJournalEntryDto,
  JournalEntryQueryDto,
} from './dto/accounts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // ─── Chart of Accounts ────────────────────────────────────────────

  @Get('chart')
  @HasPermission('Accounts.View')
  @ApiOperation({ summary: 'Get all chart of accounts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated chart of accounts' })
  findAllAccounts(@Query() query: AccountQueryDto) {
    return this.accountsService.findAllAccounts(query);
  }

  @Get('chart/:id')
  @HasPermission('Accounts.View')
  @ApiOperation({ summary: 'Get account by ID with children' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Returns account with children' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findAccountById(@Param('id') id: string) {
    return this.accountsService.findAccountById(id);
  }

  @Post('chart')
  @HasPermission('Accounts.Create')
  @ApiOperation({ summary: 'Create a new account in chart of accounts' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Account code already exists' })
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(dto);
  }

  @Put('chart/:id')
  @HasPermission('Accounts.Edit')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.updateAccount(id, dto);
  }

  @Delete('chart/:id')
  @HasPermission('Accounts.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete account from chart of accounts' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 400, description: 'Account has journal lines and cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  deleteAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount(id);
  }

  // ─── Journal Entries ──────────────────────────────────────────────

  @Get('journal')
  @HasPermission('Accounts.View')
  @ApiOperation({ summary: 'Get all journal entries with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of journal entries' })
  findAllJournalEntries(@Query() query: JournalEntryQueryDto) {
    return this.accountsService.findAllJournalEntries(query);
  }

  @Get('journal/:id')
  @HasPermission('Accounts.View')
  @ApiOperation({ summary: 'Get journal entry by ID with lines' })
  @ApiParam({ name: 'id', description: 'Journal Entry UUID' })
  @ApiResponse({ status: 200, description: 'Returns journal entry with lines and account info' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  findJournalEntryById(@Param('id') id: string) {
    return this.accountsService.findJournalEntryById(id);
  }

  @Post('journal')
  @HasPermission('Accounts.Create')
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or unbalanced entry' })
  createJournalEntry(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.accountsService.createJournalEntry(dto, userId);
  }

  @Delete('journal/:id')
  @HasPermission('Accounts.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete journal entry (cascade deletes lines)' })
  @ApiParam({ name: 'id', description: 'Journal Entry UUID' })
  @ApiResponse({ status: 200, description: 'Journal entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  deleteJournalEntry(@Param('id') id: string) {
    return this.accountsService.deleteJournalEntry(id);
  }
}
