import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ExportPDF({ children }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Laporan Data Balita Posyandu', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, 30, { align: 'center' });
    doc.text(`Total Balita: ${children.length} anak`, 105, 37, { align: 'center' });
    
    // Data Balita
    const tableData = children.map(child => [
      child.name,
      child.birth_date,
      child.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      child.parent_phone
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [['Nama', 'Tanggal Lahir', 'Jenis Kelamin', 'HP Orang Tua']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 }
    });
    
    // Simpan PDF
    doc.save(`laporan_posyandu_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  return (
    <button
      onClick={generatePDF}
      style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px'
      }}
    >
      📄 Export PDF
    </button>
  );
}

export default ExportPDF;