import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, MapPin, Sparkles, Calendar, Compass, Shield, User, Heart } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuthStore } from '@/store/authStore';

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSelect = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search stays, cities, or quick navigation (Ctrl+K)..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Popular Destinations">
          <CommandItem onSelect={() => handleSelect('/search?city=Mumbai')}>
            <MapPin className="mr-2 h-4 w-4 text-indigo-400" />
            <span>Stays in Mumbai</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/search?city=Goa')}>
            <MapPin className="mr-2 h-4 w-4 text-pink-400" />
            <span>Luxury Villas in Goa</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/search?city=Bengaluru')}>
            <MapPin className="mr-2 h-4 w-4 text-purple-400" />
            <span>Hotels in Bengaluru</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Navigation">
          <CommandItem onSelect={() => handleSelect('/search')}>
            <Compass className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Explore All Stays</span>
          </CommandItem>
          {isAuthenticated && (
            <>
              <CommandItem onSelect={() => handleSelect('/bookings')}>
                <Calendar className="mr-2 h-4 w-4 text-blue-400" />
                <span>My Reservations</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/wishlist')}>
                <Heart className="mr-2 h-4 w-4 text-rose-400" />
                <span>Saved Wishlist</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/profile')}>
                <User className="mr-2 h-4 w-4 text-amber-400" />
                <span>Account Profile</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Host Management">
              <CommandItem onSelect={() => handleSelect('/host')}>
                <Building2 className="mr-2 h-4 w-4 text-indigo-400" />
                <span>Host Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/host/properties')}>
                <Building2 className="mr-2 h-4 w-4 text-indigo-400" />
                <span>My Listings</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/host/properties/new')}>
                <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                <span>Add New Property</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Portal">
              <CommandItem onSelect={() => handleSelect('/admin')}>
                <Shield className="mr-2 h-4 w-4 text-red-400" />
                <span>Admin Overview</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/admin/users')}>
                <User className="mr-2 h-4 w-4 text-red-400" />
                <span>User Governance</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect('/admin/listings')}>
                <Building2 className="mr-2 h-4 w-4 text-red-400" />
                <span>Property Moderation</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
