import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, UrlSegment} from '@angular/router';
import {FileServerService} from '../service/file-server.service';
import {UploadObject} from '../domain-models/UploadObject';
import {Auth0ServiceService} from '../../authentication/auth0/auth0-service.service';
import {S3DownloadObject} from '../domain-models/S3DownloadObject';
import {DownloadFolderRequest} from '../domain-models/DownloadFolderRequest';
import * as JSZip from 'node_modules/jszip/dist/jszip.min.js';
import {DeleteObjectRequest} from '../domain-models/DeleteObjectRequest';
import {DeleteObjectsRequest} from '../domain-models/DeleteObjectsRequest';
import {ObjectAccessRequest} from '../domain-models/ObjectAccessRequest';
import {AdminServerService} from '../service/admin-server.service';
import {ToastrService} from 'ngx-toastr';

import {CreateBucketDialogComponent} from './create-bucket-dialog/create-bucket-dialog.component';
import {NgxSpinnerService} from 'ngx-spinner';
import {MatDialog} from '@angular/material/dialog';
import {faCloudDownloadAlt, faCloudUploadAlt, faFileAlt, faFolderPlus, faTimes, faTrashAlt} from '@fortawesome/free-solid-svg-icons';


export interface DialogData {
  bucketName: string;
}


@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.less']
})
export class FileExplorerComponent implements OnInit {

  faFolderPlus = faFolderPlus;
  faCloudDownloadAlt = faCloudDownloadAlt;
  faCloudUploadAlt = faCloudUploadAlt;
  faTrashAlt = faTrashAlt;
  faFileAlt = faFileAlt;
  faTimes = faTimes;

  bucketObjects;
  private selectedBucket: string;
  uploadPanelOpenState = false;
  fileManagerPanelOpenState = true;
  lastModified: Date;
  ownerName: string;
  selectedFileOrFolder;
  filesToBeDownloaded = [];
  private filesToBeUploaded: File[] = [];
  uploadFolderBoxTitle = 'Choose Folder';
  disableTextBox = true;
  readChecked = false;
  writeChecked = false;
  deleteChecked = false;
  selectedFileOrFolderNode;
  private filesToBeUploadedWithMetadata: Array<UploadObject> = [];


  constructor(private route: ActivatedRoute, private fileServerService: FileServerService,
              private oauth: Auth0ServiceService,
              private adminServerService: AdminServerService,
              private toastr: ToastrService,
              public dialog: MatDialog,
              private spinner: NgxSpinnerService
  ) {
    this.bucketObjects = this.route.snapshot.data.bucketObjects;
  }

  ngOnInit() {
    this.route.url.subscribe((url: UrlSegment[]) => {
      this.selectedBucket = url[0].parameters.bucketName;
    });
  }

  getBucketObjects() {
    this.fileServerService.getBucketObjects(this.oauth.getUserId(), this.selectedBucket).subscribe(value => {
        this.bucketObjects = value;
        this.displayFileStructureChart();
      },
      error => {
        if (error.status === 401) {
          this.toastr.error('Unauthorized !');
        }
      }
    );
  }

  filterBuckets(selectedBucket: string) {
    if (selectedBucket === 'Choose Bucket') {
      alert('choose Bucket name');
    } else {
      this.selectedBucket = selectedBucket.toLowerCase();
      this.getBucketObjects();
    }
  }

  displayFileStructureChart() {
    return this.getFileStructureChartData();
  }

  openUploadPanel() {
    this.uploadPanelOpenState = true;
    this.fileManagerPanelOpenState = false;
  }



  removeFileFromSelectedFiles(selectedFile) {
    this.filesToBeUploaded = this.filesToBeUploaded.filter((file) => file.name !== selectedFile);
  }

  cancelUploadTask() {
    this.uploadPanelOpenState = false;
    this.fileManagerPanelOpenState = true;
  }

  onUpload() {

    this.spinner.show();
    if (this.filesToBeUploadedWithMetadata.length > 0) {
      this.fileServerService.uploadFile(this.filesToBeUploadedWithMetadata).subscribe(uploadStatus => {
          if (uploadStatus) {
            this.getBucketObjects();
            this.toastr.success('Uploaded Successfully !', 'Bucket Object');
          }
          this.cancelUploadTask();
          this.filesToBeUploadedWithMetadata = [];
          this.filesToBeUploaded = [];
          this.spinner.hide();
        },
        error => this.toastr.error('Uploading Failed !', 'Bucket Object')
      );
    }
  }

  extractFileContents(selectedFile) {
    this.filesToBeUploaded.push(selectedFile);
    const reader = new FileReader();
    let dataToBeUploaded: UploadObject = null;
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      if (reader.result) {

        const selectedFolder = (this.selectedFileOrFolder === '/') ? '' : this.selectedFileOrFolder;
        // tslint:disable-next-line:max-line-length
        dataToBeUploaded = new UploadObject(selectedFolder.trim() + selectedFile.name,
          reader.result.toString().split(',')[1],
          this.oauth.getUser()._userName,
          this.oauth.getUserId(),
          this.selectedBucket);
        this.filesToBeUploadedWithMetadata.push(dataToBeUploaded);
      }
    };
    reader.onerror = (error) => {
      console.log('Error: ', error);
    };
  }

  onFileSelected(event) {
    const selectedFile = event.target.files[0] as File;
    this.extractFileContents(selectedFile);
  }

  onFolderSelected(event) {
    const folderName = event.target.files[0].webkitRelativePath.split('/');
    folderName.pop();
    folderName.join('/');
    this.uploadFolderBoxTitle = folderName;
    const selectedFolder = (this.selectedFileOrFolder === '/') ? '' : this.selectedFileOrFolder;
    // tslint:disable-next-line:max-line-length
    const folderNameUploadObject = new UploadObject(selectedFolder.trim() + folderName + '/', '', this.oauth.getUser()._userName, this.oauth.getUserId(), this.selectedBucket);
    this.filesToBeUploadedWithMetadata.push(folderNameUploadObject);
    [...event.target.files].forEach((file) => {
      const reader = new FileReader();
      this.filesToBeUploaded.push(file);
      let dataToBeUploaded: UploadObject = null;
      if (file.name !== '.DS_Store') {
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (reader.result) {

            // tslint:disable-next-line:max-line-length
            dataToBeUploaded = new UploadObject(selectedFolder.trim() + folderName + '/' + file.name, reader.result.toString().split(',')[1], this.oauth.getUser()._userName, this.oauth.getUserId(), this.selectedBucket);
            this.filesToBeUploadedWithMetadata.push(dataToBeUploaded);
          }
        };
        reader.onerror = (error) => {
          console.log('Error: ', error);
        };
      }
    });
  }

  assignSelectedFileOrFolder(selectedFileOrFolderEvent) {

    this.selectedFileOrFolderNode = selectedFileOrFolderEvent;
    this.selectedFileOrFolder = selectedFileOrFolderEvent.data.completeName;
    this.lastModified = selectedFileOrFolderEvent.data.lastModified;
    this.ownerName = selectedFileOrFolderEvent.data.owner;
    if (selectedFileOrFolderEvent.data.accessInfo !== null) {
      this.readChecked = selectedFileOrFolderEvent.data.accessInfo.read;
      this.writeChecked = selectedFileOrFolderEvent.data.accessInfo.write;
      this.deleteChecked = selectedFileOrFolderEvent.data.accessInfo.delete;
    } else {
      this.readChecked = false;
      this.writeChecked = false;
      this.deleteChecked = false;
    }
  }

  downloadFileFolder() {
    if (this.selectedFileOrFolderNode.children !== undefined) {
      this.filesToBeDownloaded = [];
      this.downloadFolder(this.selectedFileOrFolderNode);
    } else {
      const fileName = this.selectedFileOrFolder.split('/')[this.selectedFileOrFolder.split('/').length - 1];
      this.downloadFile(fileName, this.selectedFileOrFolder, this.selectedBucket);
    }

  }

  deleteFileFolder() {
    if (this.selectedFileOrFolderNode.children !== undefined) {
      const deleteObjectsRequest = new DeleteObjectsRequest();
      const requests = [];
      const folderDeleteRequest = new DeleteObjectRequest();
      folderDeleteRequest.bucketName = this.selectedBucket;
      folderDeleteRequest.objectName = this.selectedFileOrFolderNode.data.completeName;
      folderDeleteRequest.ownerId = this.selectedFileOrFolderNode.data.ownerId;
      requests.push(folderDeleteRequest);
      this.selectedFileOrFolderNode.children.forEach(child => {
        const request = new DeleteObjectRequest();
        request.bucketName = this.selectedBucket;
        request.objectName = child.data.completeName;
        request.ownerId = child.data.ownerId;
        requests.push(request);
      });
      deleteObjectsRequest.folderObjects = requests;
      deleteObjectsRequest.bucketName = this.selectedBucket;

      this.fileServerService.deleteFolder(deleteObjectsRequest).subscribe(deleteStatus => {
          if (deleteStatus) {
            this.getBucketObjects();
            this.toastr.success('Deleted Successfully !', 'Folder');
          }
        },
        error => this.toastr.error('Deletion Failed !', 'Folder'));
    } else {
      this.fileServerService
        .deleteFile(this.selectedFileOrFolder, this.selectedBucket, this.selectedFileOrFolderNode.data.ownerId).subscribe(deleteStatus => {
          if (deleteStatus) {
            this.getBucketObjects();
            this.toastr.success('Deleted Successfully !', 'File');
          }
          this.selectedFileOrFolder = null;
        },
        error => this.toastr.error('Deletion Failed !', 'File'));
    }
  }
  submitNewFolder() {
    // tslint:disable-next-line:max-line-length
    const dataToBeUploaded: UploadObject = new UploadObject(this.selectedFileOrFolder, '', this.oauth.getUser()._userName, this.oauth.getUserId(), this.selectedBucket);
    this.fileServerService.createNewFolder(dataToBeUploaded).subscribe(createStatus => {
        if (createStatus) {
          this.getBucketObjects();
          this.toastr.success('New Folder Successfully !', 'Folder');
          this.selectedFileOrFolder = null;
          this.disableTextBox = true;
        }
      },
      error => this.toastr.success('New Folder Creation Failed !', 'Folder')
    );
  }

  createAccessRequest(access) {
    const userName = this.oauth.getUser()._userName;
    if (this.selectedFileOrFolderNode.children === undefined) {

      const objectAccessRequest = new ObjectAccessRequest();
      objectAccessRequest.access = access;
      objectAccessRequest.bucketName = this.selectedBucket;
      objectAccessRequest.objectName = this.selectedFileOrFolderNode.data.completeName;
      objectAccessRequest.ownerId = this.selectedFileOrFolderNode.data.ownerId;
      objectAccessRequest.userName = userName;
      objectAccessRequest.userId = this.oauth.getUserId();
      this.adminServerService.createAccessRequest([objectAccessRequest]).subscribe(value => {

        (value) ? this.toastr.success(access + 'Request created Successfully ', 'Access Request') :
          this.toastr.error(access + 'Request failed !', 'Access Request');
      });
      this.readChecked = false;
      this.writeChecked = false;
      this.deleteChecked = false;
    } else {

      const requests = [];
      const objectAccessRequest = new ObjectAccessRequest();
      objectAccessRequest.access = access;
      objectAccessRequest.bucketName = this.selectedBucket;
      objectAccessRequest.objectName = this.selectedFileOrFolderNode.data.completeName;
      objectAccessRequest.ownerId = this.selectedFileOrFolderNode.data.ownerId;
      objectAccessRequest.userName = userName;
      objectAccessRequest.userId = this.oauth.getUserId();
      requests.push(objectAccessRequest);
      this.selectedFileOrFolderNode.children.forEach(child => {
        const request = new ObjectAccessRequest();
        request.access = access;
        request.bucketName = this.selectedBucket;
        request.objectName = child.data.completeName;
        request.ownerId = child.data.ownerId;
        request.userName = userName;
        request.userId = this.oauth.getUserId();
        requests.push(request);
      });

      this.adminServerService.createAccessRequest(requests).subscribe(value => {

        (value) ? this.toastr.success(access + 'Request created Successfully ', 'Access Request') :
          this.toastr.error(access + 'Request failed !', 'Access Request');
      });
      this.readChecked = false;
      this.writeChecked = false;
      this.deleteChecked = false;
    }
  }

  private getFileStructureChartData() {
    return this.bucketObjects;
  }

  private downloadFile(fileName, objectName, bucketName) {
    this.fileServerService.downloadFile(fileName, objectName, bucketName);
  }

  private downloadFolder(node) {
    const downloadFolderRequest: DownloadFolderRequest = new DownloadFolderRequest();
    const zipFile: JSZip = new JSZip();
    this.objectPathExtractor(node.children);
    downloadFolderRequest.objectsToBeDownloaded = this.filesToBeDownloaded;
    this.fileServerService.downloadFolder(downloadFolderRequest).subscribe(value => {
      value.forEach((object) => {
        zipFile.file(object.objectName, object.downloadedObjectInBase64, {base64: true});
      });
      zipFile.generateAsync({type: 'blob'})
        .then((content) => {
          saveAs(content, node.data.name);
        });
    });
  }

  private objectPathExtractor(node) {
    node.forEach((g) => {
      if (typeof (g) === 'object') {
        if (!('children' in g)) {
          if (!g.data.name.endsWith('/')) {
            const s3DownloadObject = new S3DownloadObject();
            s3DownloadObject.bucketName = this.selectedBucket;
            s3DownloadObject.fileName = g.data.name;
            s3DownloadObject.objectName = g.data.completeName;
            this.filesToBeDownloaded.push(s3DownloadObject);
          }
        } else {
          this.objectPathExtractor(g.children);
        }
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CreateBucketDialogComponent, {
      width: '300px',
      data: {name: this.selectedFileOrFolder}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.selectedFileOrFolder === '/') {
        this.selectedFileOrFolder = '';
      }
      this.selectedFileOrFolder = this.selectedFileOrFolder + result + '/';

      this.submitNewFolder();
    });
  }
}
