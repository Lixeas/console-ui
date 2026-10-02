import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { getUserOrganization } from '@shared/models/data/user';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-context-selector',
  imports: [MatButtonModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatMenuModule],
  templateUrl: './context-selector.component.html',
  styleUrl: './context-selector.component.scss',
})
export class ContextSelectorComponent {
  protected auth = inject(AuthService);
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);

  // Natural sort: case-insensitive and numbers compared by value ("org2" before "org10").
  orgList = computed(() => {
    const user = this.auth.user();
    const orgs = user ? getUserOrganization(user) : [];
    return orgs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  });

  orgFilter = signal('');

  filteredOrgList = computed(() => {
    const filter = this.orgFilter().trim().toLowerCase();
    return filter ? this.orgList().filter(org => org.name.toLowerCase().includes(filter)) : this.orgList();
  });

  private orgSearchInput = viewChild<ElementRef<HTMLInputElement>>('orgSearchInput');

  background = input<'normal' | 'inverted'>('normal');

  orgSelectOpened(opened: boolean) {
    if (opened) {
      this.orgSearchInput()?.nativeElement.focus();
    } else {
      this.orgFilter.set('');
    }
  }

  // Enter picks the first match; every other key stays in the input instead of
  // triggering mat-select typeahead and selection.
  onOrgSearchKeydown(event: KeyboardEvent, select: MatSelect) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const first = this.filteredOrgList()[0];
      if (first) {
        select.close();
        if (first.id !== this.stateSvc.organization()?.id) {
          this.orgChanged(first.id);
        }
      }
    } else if (event.key !== 'Escape' && event.key !== 'Tab') {
      event.stopPropagation();
    }
  }

  orgChanged(orgId: string) {
    this.stateSvc.setOrganization(orgId);
  }

  projectChanged(projectId: string) {
    this.stateSvc.setProject(projectId);
  }
}
