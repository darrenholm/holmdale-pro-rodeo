import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/railwayClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
          checkAuth();
    }, []);

    const checkAuth = async () => {
          try {
                  setIsLoadingAuth(true);
                  setAuthError(null);

            const token = api.getToken();

            if (token) {
                      // Fetch real user data from Railway including actual role
                    const currentUser = await api.get('/auth/me');
                      setUser(currentUser);
                      setIsAuthenticated(true);
            } else {
                      setIsAuthenticated(false);
            }
          } catch (error) {
                  console.error('Auth check failed:', error);
                  api.clearToken();
                  setIsAuthenticated(false);
          } finally {
                  setIsLoadingAuth(false);
          }
    };

    const login = async (email, password) => {
          try {
                  setIsLoadingAuth(true);
                  await api.login(email, password);
                  // Fetch real user data after login
            const currentUser = await api.get('/auth/me');
                  setUser(currentUser);
                  setIsAuthenticated(true);
                  return true;
          } catch (error) {
                  setAuthError({ type: 'auth_failed', message: error.message });
                  return false;
          } finally {
                  setIsLoadingAuth(false);
          }
    };

    const logout = () => {
          api.clearToken();
          setUser(null);
          setIsAuthenticated(false);
          window.location.href = '/';
    };

    const navigateToLogin = () => {
          window.location.href = '/Stafifm'p;o
      r t  }R;e
  a
  c t ,r e{t ucrrne a(t
                      e C o n t<eAxutt,h CuosnetSetxatt.eP,r ouvsiedCeorn tveaxltu,e =u{s{e
                                                                                          E f f e c t  u}s efrr,o
                                                                                        m   ' r e a cits'A;u
                                                                                        tihmepnotritc a{t eadp,i
                                                                                                        }   f r o mi s'L@o/aadpiin/grAauitlhw,a
                                                                                          y C l i e n ti's;L
                                                                                          o
                                                                                        acdoinnsgtP uAbultihcCSoenttteixntg s=, 
                                                                                          c r e a t e CaounttheExrtr(o)r;,


            e x p o r ta pcpoPnusbtl iAcuStehtPtrionvgisd:e rn u=l l(,{
                c h i l d rleong i}n), 
    = >   { 
        lcoognosutt ,[
          u s e r ,   sneatvUisgeart]e T=o LuosgeiSnt,a
           t e ( n u l lc)h;e
           c k AcpopnSstta t[ei:s AcuhtehceknAtuitcha
           t e d ,  }s}e>t
I s A u t h e{ncthiicladtreedn]} 
=   u s e<S/tAautteh(Cfoanltseex)t;.
P r ocvoindsetr >[
  i s L)o;a
d}i;n
g
Aeuxtpho,r ts ectoInssLto audsienAguAtuht h=]  (=)  u=s>e S{t
a t ec(otnrsute )c;o
                                                            n t ecxotn s=t  u[siesCLoonatdeixntg(PAuubtlhiCcoSnettetxitn)g;s
                                                            ,   sieft I(s!LcooandtienxgtP
