import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faApple } from '@fortawesome/free-brands-svg-icons';
import { faUniversity, faCubes, faBullseye, faCheckCircle, faChevronRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WalletData, Transaction } from './types';

// Add icons to library
library.add(faApple, faUniversity, faCubes, faBullseye, faCheckCircle, faChevronRight, faArrowLeft);

function Home() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayPoints, setTodayPoints] = useState(0);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then((json: any) => {
        const walletData: WalletData = {
          currentBalance: json.balance.current,
          limit: json.balance.limit,
          hasPaymentDue: json.paymentDue,
          transactions: json.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            name: t.name,
            description: t.description,
            date: new Date(t.date),
            status: t.status,
            authorizedBy: t.authorizedBy,
            totalAward: t.totalAward,
            icon: t.icon,
          })).sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime()),
        };
        setData(walletData);
        setTodayPoints(calculateDailyPoints(new Date('2025-10-22')));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading JSON:', err);
        setLoading(false);
      });
  }, []);

  const navigate = useNavigate();

  if (loading) return <div className="loading">Loading...</div>;

  const formatPoints = (points: number) => points >= 1000 ? `${(points / 1000).toFixed(0)}K` : points.toFixed(2);
  const iconMap: { [key: string]: any } = {
    apple: 'apple',
    university: 'university',
    cubes: 'cubes',
    bullseye: 'bullseye',
  };

  const getPercent = (tx: Transaction) => tx.totalAward > 0 ? `${Math.round((tx.totalAward / Math.abs(tx.amount)) * 100)}%` : '';

  let previousDay = '';

  return (
    <div className="home">
      <div className="top-row">
        <div className="left-section">
          <div className="card balance-card">
            <h3>Card Balance</h3>
            <div className="balance-current">${data!.currentBalance.toFixed(2)}</div>
            <div className="balance-available">${(data!.limit - data!.currentBalance).toFixed(2)} Available</div>
          </div>
          <div className="card daily-points-card">
            <h3>Daily Points</h3>
            <div className="daily-value">{formatPoints(todayPoints)}</div>
          </div>
        </div>
        <div className="card no-payment-card">
          <h3>No Payment Due</h3>
          <div className="no-payment-text">You've paid your September balance.</div>
          <div className="icon-wrapper">
            <FontAwesomeIcon icon="check-circle" className="no-payment-icon" />
          </div>
        </div>
      </div>
      <div className="card transactions-card">
        <h3>Latest Transactions</h3>
        {data!.transactions.slice(0, 10).map(tx => {
          const currentDay = getDisplayDate(tx.date, new Date('2025-10-22'));
          let header = null;
          if (currentDay !== previousDay) {
            header = <div key={`header-${currentDay}`} className="day-header">{currentDay}</div>;
            previousDay = currentDay;
          }
          const logoClass = `logo logo-${tx.icon} ${tx.description.includes('Card Number Used') ? 'gray' : 'color'}`;
          const amountClass = tx.amount < 0 ? 'credit' : 'debit';
          const signAmount = tx.amount >= 0 ? `$${tx.amount.toFixed(2)}` : `+$${Math.abs(tx.amount).toFixed(2)}`;
          return [
            header,
            <div key={tx.id} className="transaction-item" onClick={() => navigate(`/transaction/${tx.id}`)}>
              <FontAwesomeIcon icon={iconMap[tx.icon]} className={logoClass} />
              <div className="content">
                <div className="row1">
                  <div className="title">{tx.name}</div>
                  <div className={`amount ${amountClass}`}>{signAmount} <FontAwesomeIcon icon="chevron-right" className="arrow" /></div>
                </div>
                <div className="row2">
                  <div className="subtitle">{(tx.status === 'Pending' ? 'Pending - ' : '') + tx.description}</div>
                  {getPercent(tx) && <div className="percent">{getPercent(tx)}</div>}
                </div>
                <div className="row3">
                  <div className="trailing">{tx.authorizedBy ? `${tx.authorizedBy} - ` : ''}{currentDay}</div>
                </div>
              </div>
            </div>
          ];
        }).flat().filter(Boolean)}
      </div>
    </div>
  );
}

function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then((json: any) => {
        const transaction = json.transactions.find((t: any) => t.id === parseInt(id!));
        if (transaction) {
          setTx({
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            name: transaction.name,
            description: transaction.description,
            date: new Date(transaction.date),
            status: transaction.status,
            authorizedBy: transaction.authorizedBy,
            totalAward: transaction.totalAward,
            icon: transaction.icon,
          });
        }
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (loading || !tx) return <div>Loading...</div>;

  const signAmount = tx.amount >= 0 ? `$${tx.amount.toFixed(2)}` : `+$${Math.abs(tx.amount).toFixed(2)}`;

  const dateStr = tx.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  const timeStr = '12:47'; // Assumed from image; extend data with time if needed

  return (
    <div className="detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon="arrow-left" />
      </button>
      <div className="large-amount">{signAmount}</div>
      <div className="name">{tx.name}</div>
      <div className="date-time">{dateStr}, {timeStr}</div>
      <div className="info-card">
      <div className="status-box">Status: {tx.status}</div>
      <div className="description">{tx.description}</div>
      <div className="total">
        <span>Total</span>
        <span>{signAmount}</span>
      </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/transaction/:id" element={<TransactionDetail />} />
    </Routes>
  );
}

function calculateDailyPoints(currentDate: Date): number {
  if (currentDate.toISOString().slice(0, 10) === '2025-10-22') return 45000;
  const seasonStart = new Date('2025-09-22');
  const diffTime = currentDate.getTime() - seasonStart.getTime();
  const dayOfSeason = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  if (dayOfSeason <= 0) return 0;
  if (dayOfSeason === 1) return 1;
  if (dayOfSeason === 2) return 2;
  let previous2 = 1.0;
  let previous1 = 2.0;
  let points = 2.0;
  for (let i = 3; i <= dayOfSeason; i++) {
    points = previous1 + 0.01 * previous2;
    points = Math.round(points * 100) / 100;
    previous2 = previous1;
    previous1 = points;
  }
  return points;
}

function getDisplayDate(date: Date, now: Date): string {
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays[date.getDay()];
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export default App;