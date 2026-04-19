import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function GrowthChart({ growthData, childName }) {
  if (!growthData || growthData.dates.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#f7fafc',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <p>Belum ada data pemeriksaan untuk {childName}</p>
        <p>Silakan input pemeriksaan berat dan tinggi badan terlebih dahulu.</p>
      </div>
    );
  }

  const weightData = {
    labels: growthData.dates,
    datasets: [
      {
        label: 'Berat Badan (kg)',
        data: growthData.weights,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Tinggi Badan (cm)',
        data: growthData.heights,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Grafik Pertumbuhan ${childName}`,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            let value = context.raw;
            return `${label}: ${value} ${context.dataset.label.includes('Berat') ? 'kg' : 'cm'}`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Nilai'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Tanggal Pemeriksaan'
        }
      }
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginTop: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Line data={weightData} options={options} />
    </div>
  );
}

export default GrowthChart;