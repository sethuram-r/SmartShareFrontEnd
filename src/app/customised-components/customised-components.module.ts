import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminComponent} from './admin/admin.component';
import {SideNavBarComponent} from './side-nav-bar/side-nav-bar.component';
import {MenuBarComponent} from './menu-bar/menu-bar.component';
import {DialogBoxComponent} from './dialog-box/dialog-box.component';
import {CollapsableCardComponent} from './collapsable-card/collapsable-card.component';
import {FlowerChartComponent} from './flower-chart/flower-chart.component';
import {FileTreeListComponent} from './file-tree-list/file-tree-list.component';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatInputModule,
  MatPaginatorModule,
  MatSidenavModule,
  MatSortModule,
  MatTableModule,
  MatToolbarModule
} from '@angular/material';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {OwnerTreeComponent} from './owner-tree/owner-tree.component';
import {UserTreeComponent} from './user-tree/user-tree.component';


@NgModule({
  declarations: [
    AdminComponent,
    SideNavBarComponent,
    MenuBarComponent,
    DialogBoxComponent,
    CollapsableCardComponent,
    FlowerChartComponent,
    FileTreeListComponent,
    OwnerTreeComponent,
    UserTreeComponent
  ],
  exports: [
    AdminComponent,
    SideNavBarComponent,
    MenuBarComponent,
    DialogBoxComponent,
    CollapsableCardComponent,
    FlowerChartComponent,
    FileTreeListComponent,
    FontAwesomeModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    FormsModule
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    FontAwesomeModule,
    MatPaginatorModule,
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    RouterModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatSortModule
  ]
})
export class CustomisedComponentsModule {
}
