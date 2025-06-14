import { useState, useEffect } from 'react';
import axios from 'axios';

export const useRepairData = () => {
  const [dateRange, setDateRange] = useState({
    start: '2025-05-01',
    end: '2025-05-07',
  });
  const [stats, setStats] = useState([]);
  const [byType, setByType] = useState([]);
  const [byArea, setByArea] = useState([]);
  const [byTime, setByTime] = useState([]);
  const [finance, setFinance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/admin', {
          params: {
            start: dateRange.start,
            end: dateRange.end
          }
        });
        
        const data = response.data;
        setStats(data.stats || []);
        setByType(data.byType || []);
        setByArea(data.byArea || []);
        setByTime(data.byTime || []);
        setFinance(data.finance || []);
        setPerformance(data.performance || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    stats,
    byType,
    byArea,
    byTime,
    finance,
    performance,
    loading,
    error
  };
};