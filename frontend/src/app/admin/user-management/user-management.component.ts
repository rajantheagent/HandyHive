import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="management-container">
      <h2>User Management</h2>
      <mat-form-field appearance="outline" class="search-field">
        <input matInput placeholder="Search users...">
      </mat-form-field>
      <mat-card class="card-elevated">
        <mat-card-content>
          <p>User table - to be implemented</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .management-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h2 { font-weight: 600; margin-bottom: 16px; }
    .search-field { width: 100%; max-width: 400px; margin-bottom: 16px; }
  `]
})
export class UserManagementComponent {}
