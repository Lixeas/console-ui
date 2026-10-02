import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelect } from '@angular/material/select';
import { Organization } from '@shared/models/data/organization';
import { User } from '@shared/models/data/user';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { StateService } from '@shared/services/state.service';

import { ContextSelectorComponent } from './context-selector.component';

function org(id: string, name: string): Organization {
  return { id, name, ownerId: 'user', projects: [] } as unknown as Organization;
}

describe('ContextSelectorComponent', () => {
  let component: ContextSelectorComponent;
  let fixture: ComponentFixture<ContextSelectorComponent>;
  let setOrganization: jasmine.Spy;

  beforeEach(async () => {
    const user = {
      id: 'user',
      personalOrg: [org('1', 'org10'), org('2', 'HGTY')],
      guestOrg: [org('3', 'dfgt'), org('4', 'ABCD'), org('5', 'org2')],
    } as unknown as User;
    setOrganization = jasmine.createSpy('setOrganization');

    await TestBed.configureTestingModule({
      imports: [ContextSelectorComponent],
      providers: [
        { provide: AuthService, useValue: { user: signal(user) } },
        {
          provide: StateService,
          useValue: { organization: signal(undefined), project: signal(undefined), setOrganization },
        },
        { provide: OrganizationService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort organizations alphabetically, ignoring case and comparing numbers by value', () => {
    expect(component.orgList().map(o => o.name)).toEqual(['ABCD', 'dfgt', 'HGTY', 'org2', 'org10']);
  });

  it('should filter organizations by a case-insensitive substring', () => {
    component.orgFilter.set('DF');
    expect(component.filteredOrgList().map(o => o.name)).toEqual(['dfgt']);

    component.orgFilter.set('org');
    expect(component.filteredOrgList().map(o => o.name)).toEqual(['org2', 'org10']);

    component.orgFilter.set('zzz');
    expect(component.filteredOrgList()).toEqual([]);
  });

  it('should reset the filter when the select closes', () => {
    component.orgFilter.set('DF');
    component.orgSelectOpened(false);
    expect(component.orgFilter()).toBe('');
  });

  it('should select the first match on Enter', () => {
    const select = jasmine.createSpyObj<MatSelect>('MatSelect', ['close']);
    component.orgFilter.set('h');
    component.onOrgSearchKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), select);

    expect(select.close).toHaveBeenCalled();
    expect(setOrganization).toHaveBeenCalledWith('2');
  });

  it('should show the search field and only the matching options in the opened panel', async () => {
    const trigger = fixture.nativeElement.querySelector('#orgSelect .mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    await fixture.whenStable();

    const input = document.querySelector('.context-selector__search input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'DF';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const options = Array.from(document.querySelectorAll('mat-option')).map(o => o.textContent?.trim());
    expect(options.length).toBe(1);
    expect(options[0]).toContain('dfgt');
  });

  it('should keep typed keys away from mat-select', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' });
    spyOn(event, 'stopPropagation');
    component.onOrgSearchKeydown(event, jasmine.createSpyObj<MatSelect>('MatSelect', ['close']));
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
