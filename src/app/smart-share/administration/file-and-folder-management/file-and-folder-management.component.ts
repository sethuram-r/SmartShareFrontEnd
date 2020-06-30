import {Component, OnInit} from '@angular/core';
import {AdminServerService} from '../../service/admin-server.service';
import {Request} from '../../domain-models/Request';
import {NavigationEnd, Router} from '@angular/router';
import {Auth0ServiceService} from '../../../authentication/auth0/auth0-service.service';
import {ToastrService} from 'ngx-toastr';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {faUserSecret, faUserTie} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-file-and-folder-management',
  templateUrl: './file-and-folder-management.component.html',
  styleUrls: ['./file-and-folder-management.component.less']
})
export class FileAndFolderManagementComponent implements OnInit {

  faUserSecret = faUserSecret;
  faUserTie = faUserTie;

  metadata: any;
  perspective: any;
  perspectiveButton: any;

  constructor(private adminService: AdminServerService,
              private router: Router,
              private oauth: Auth0ServiceService,
              private toaster: ToastrService) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        if (val.url === '/dashboard/administration/userManged') {
          this.perspectiveButton = false;
        } else {
          this.perspectiveButton = true;
        }
      }
    });
    this.perspective = 'owner';
  }

  reloadCurrentRoute() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  fetchBucketObjectAccessRequests(userId) {
    this.adminService.getBucketObjectAccessRequestsAsUser(userId).subscribe(value => {
      this.metadata = {
        type: 'Bucket Object',
        displayedColumns: ['select', 'bucketObjectName', 'bucketName', 'ownerName', 'requestType', 'status', 'action'],
        data: value,
        groupByColumns: ['bucketObjectName']
      };
    });
  }

  fetchBucketObjectAccessRequestsAsOwner(ownerId) {
    this.adminService.getBucketObjectAccessRequestsAsOwner(ownerId).subscribe(value => {
      this.metadata = {
        type: 'Bucket Object',
        displayedColumns: ['select', 'bucketObjectName', 'bucketName', 'userName', 'requestType', 'status', 'action'],
        data: value,
        groupByColumns: ['bucketObjectName']
      };
    });
  }

  ngOnInit() {
    this.fetchBucketObjectAccessRequestsAsOwner(this.oauth.getUserId());
  }

  handleRequest(request: Request) {

    switch (request.type) {
      case 'accept':
        this.adminService.approveBucketObjectAccessRequest(request.content).subscribe(value => {
            if (value) {
              this.toaster.success('Access Request Approved Successfully !');
              this.reloadCurrentRoute();
            }
          },
          error => this.toaster.error('Approving Access Request Failed !')
        );
        break;
      case 'reject':
        this.adminService.rejectBucketObjectAccessRequest(request.content).subscribe(value => {
            if (value) {
              this.toaster.success('Access Request Rejected Successfully !');
              this.reloadCurrentRoute();
            }
          },
          error => this.toaster.error('Rejecting Access Request Failed !'));
        break;
      case 'delete':
        this.adminService.deleteBucketObjectAccessRequest(request.content).subscribe(value => {
            if (value) {
              this.toaster.success('Access Request Deleted Successfully !');
              this.reloadCurrentRoute();
            }
          },
          error => this.toaster.error('Deleting Access Request Failed !'));
        break;
      default:
        console.log('No respective handlers available for given request');
    }
  }

  changePerspective(event: MatButtonToggleChange) {
    this.perspective = event.value;

    if (this.perspective === 'user') {

      this.fetchBucketObjectAccessRequests(this.oauth.getUserId());
    } else {
      this.fetchBucketObjectAccessRequestsAsOwner(this.oauth.getUserId());
    }
  }
}
