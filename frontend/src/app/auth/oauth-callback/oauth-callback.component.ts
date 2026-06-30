import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="auth-container"><p>Redirecting...</p></div>`,
  styles: [`.auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }`]
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private router: Router) {}
  ngOnInit(): void {
    // OAuth removed — redirect to login
    this.router.navigate(['/auth/login']);
  }
}
