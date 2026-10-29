import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseURL = `http://localhost:3000/api/auth`; 
  token: any = `accesstoken_` + localStorage.getItem('token');
  constructor(private _HttpClient: HttpClient, private _Router: Router) {
    this.token = `accesstoken_` + localStorage.getItem('token');
  }
  
  loginWithGmail(data: any): Observable<any> {
    return this._HttpClient.post(this.baseURL + '/google-login', data); 
  }

  signUpWithGmail(data: any): Observable<any> {
    return this._HttpClient.post(this.baseURL + '/google-register', data); 
  }
}


