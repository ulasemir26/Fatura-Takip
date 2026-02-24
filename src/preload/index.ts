import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  contacts: {
    list: () => ipcRenderer.invoke('contacts:list'),
    create: (payload: any) => ipcRenderer.invoke('contacts:create', payload),
    update: (id: number, payload: any) => ipcRenderer.invoke('contacts:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('contacts:delete', id)
  },
  products: {
    list: () => ipcRenderer.invoke('products:list'),
    create: (payload: any) => ipcRenderer.invoke('products:create', payload),
    update: (id: number, payload: any) => ipcRenderer.invoke('products:update', id, payload),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id)
  },
  invoices: {
    list: (filters?: any) => ipcRenderer.invoke('invoices:list', filters),
    create: (payload: any) => ipcRenderer.invoke('invoices:create', payload),
    items: (invoiceId: number) => ipcRenderer.invoke('invoice-items:list', invoiceId)
  },
  payments: {
    list: (filters?: any) => ipcRenderer.invoke('payments:list', filters),
    create: (payload: any) => ipcRenderer.invoke('payments:create', payload)
  },
  dashboard: { get: () => ipcRenderer.invoke('dashboard:get') },
  reports: { get: () => ipcRenderer.invoke('reports:get') },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    list: () => ipcRenderer.invoke('backup:list'),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath)
  },
  demo: { seed: () => ipcRenderer.invoke('demo:seed') }
});
