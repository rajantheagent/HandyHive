import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  services = [
    { icon: '⚡', name: 'Electrician', description: 'Wiring, switch repairs, circuit breakers, lighting installations & full electrical inspections' },
    { icon: '🔧', name: 'Plumber', description: 'Pipe leaks, blocked drains, geyser repairs, bathroom fittings & water pressure issues' },
    { icon: '🪚', name: 'Carpenter', description: 'Custom furniture, door repairs, kitchen cabinets, shelving & wood restoration' },
    { icon: '🎨', name: 'Painter', description: 'Interior walls, exterior facades, waterproofing, texture finishes & colour consultation' },
    { icon: '🧹', name: 'Cleaning', description: 'Deep cleaning, move-in/out cleaning, carpet shampoo, window washing & regular upkeep' },
    { icon: '❄️', name: 'AC & HVAC', description: 'Installation, gas refills, duct cleaning, thermostat setup & seasonal servicing' },
    { icon: '🔒', name: 'Locksmith', description: 'Lock changes, key cutting, gate motors, access control & emergency lockouts' },
    { icon: '🌿', name: 'Gardening', description: 'Lawn mowing, hedge trimming, irrigation systems, tree felling & landscape design' },
  ];

  steps = [
    { number: '1', title: 'Search Nearby', description: 'Open the map and instantly see verified service providers near your location. Filter by service type, rating, or price.' },
    { number: '2', title: 'Book Instantly', description: 'Select a provider, describe the job in detail, choose a time slot, and confirm your booking in seconds.' },
    { number: '3', title: 'Track Live', description: 'Watch your provider approach on a real-time map with live ETA updates and arrival notifications.' },
    { number: '4', title: 'Pay Securely', description: 'Payment is held in escrow until you confirm the job is done to your satisfaction. Rate and review after.' },
  ];

  benefits = [
    { icon: 'verified_user', title: 'Verified & Vetted', description: 'Every provider undergoes ID verification, skill assessment, and background checks before being approved on our platform.' },
    { icon: 'my_location', title: 'Live GPS Tracking', description: 'Track your provider\'s real-time location on an interactive map. Know exactly when they\'ll arrive — no more waiting around.' },
    { icon: 'lock', title: 'Escrow Payments', description: 'Your money is safe. We hold payment until you confirm the work is complete and you\'re satisfied with the result.' },
    { icon: 'star', title: 'Transparent Reviews', description: 'Every completed job gets rated. Read honest reviews from real customers before you book any provider.' },
    { icon: 'flash_on', title: '2-Minute Response', description: 'Providers have 2 minutes to accept your request. If they don\'t, we automatically suggest alternatives — no delays.' },
    { icon: 'support_agent', title: 'Dispute Protection', description: 'If something goes wrong, our support team resolves disputes within 48 hours with fair refund options.' },
  ];

  testimonials = [
    { name: 'Sarah Mokoena', role: 'Homeowner, Sandton', text: 'I had a burst pipe at 7am and found a plumber on HandyHive within 3 minutes. He arrived in 20 minutes and fixed it perfectly. The live tracking took all the anxiety away.' },
    { name: 'James Khumalo', role: 'Tenant, Braamfontein', text: 'As a renter, I used to struggle finding reliable handymen. HandyHive\'s verification system means I can trust whoever shows up. Prices are transparent too — no surprises.' },
    { name: 'Priya Naidoo', role: 'Office Manager, Rosebank', text: 'We use HandyHive for all our office maintenance — electrical, cleaning, AC servicing. The booking history and invoicing makes expense tracking effortless.' },
    { name: 'David van Wyk', role: 'Provider, Electrician', text: 'Since joining HandyHive, my client base has tripled. The platform handles all the booking logistics so I can focus on doing great work. Payments land within 24 hours.' },
  ];

  appStats = [
    { value: '500+', label: 'Verified Providers' },
    { value: '10,000+', label: 'Jobs Completed' },
    { value: '4.8', label: 'Average Rating' },
    { value: '<15min', label: 'Avg. Response Time' },
  ];
}
