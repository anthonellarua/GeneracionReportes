import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as xlsx from 'xlsx';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  filtroGenero: string = '';
  filtroLanzamiento: string = '';

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  aplicarFiltros() {
    this.peliculasFiltradas = this.peliculas.filter(pelicula => {
      let cumpleFiltroGenero = this.filtroGenero === '' || pelicula.genero === this.filtroGenero;
      let cumpleFiltroLanzamiento = this.filtroLanzamiento === '' || pelicula.lanzamiento === Number(this.filtroLanzamiento);
      return cumpleFiltroGenero && cumpleFiltroLanzamiento;
    });
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.peliculasFiltradas = data; // Inicializa las películas filtradas con todos los datos al principio
    });
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'filaEncabezado' },
              { text: 'Género', style: 'filaEncabezado' },
              { text: 'Año de lanzamiento', style: 'filaEncabezado' }
            ],
            ...this.peliculasFiltradas.map(pelicula => [
              { text: pelicula.titulo, style: 'filaDatos' },
              { text: pelicula.genero, style: 'filaDatos' },
              { text: pelicula.lanzamiento.toString(), style: 'filaDatos' }
            ])
          ]
        }
      }
    ];

    const estilos = {
      header: {
        fontSize: 18,
        bold: true,
        color: 'blue',
        marginBottom: 10
      },
      subtitulo: {
        fontSize: 14,
        bold: true,
        marginBottom: 5
      },
      texto: {
        fontSize: 12,
        marginBottom: 5
      },
      tabla: {
        marginTop: 10,
        fontSize: 12
      },
      filaEncabezado: {
        bold: true,
        fillColor: '#CCCCCC'
      },
      filaDatos: {
        italics: true,
        color: 'gray'
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  exportarExcel() {
    const worksheet: xlsx.WorkSheet = xlsx.utils.json_to_sheet(this.peliculasFiltradas);
    const workbook: xlsx.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivo(excelBuffer, 'informe_peliculas.xlsx');
  }
  
  guardarArchivo(buffer: any, nombreArchivo: string) {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url: string = window.URL.createObjectURL(data);
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
}
