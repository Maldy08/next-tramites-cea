export interface Oficina {
  idOfi: number;
  nombre: string;
  rutaTrans: string;
}

export interface Ciudad {
  idCiudad: number;
  idEstado: number;
  ciudad: string;
}

export interface Estado {
  idEstado: number;
  idPais: number;
  estado: string;
}

export interface Pais {
  idPais: number;
  pais: string;
}

export interface CatalogosViaticos {
  oficinas: Oficina[];
  ciudades: Ciudad[];
  estados: Estado[];
  paises: Pais[];
}
