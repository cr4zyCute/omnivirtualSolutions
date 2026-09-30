import React, { useEffect, useState } from 'react';
import { useCms } from '../context/CmsContext';

function AnimatedCounter({ endValue, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const target = parseInt(endValue, 10) || 0;

  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(Math.floor(duration / (target || 1)), 15);
    const increment = Math.ceil(target / (duration / stepTime));

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function Stats() {
  const { stats } = useCms();

  const items = [
    { key: 'clients', label: 'Clients', defaultVal: 232 },
    { key: 'projects', label: 'Projects', defaultVal: 521 },
    { key: 'hours_support', label: 'Hours Of Support', defaultVal: 1453 },
    { key: 'workers', label: 'Workers', defaultVal: 32 },
  ];

  return (
    <section id="stats" className="stats section">
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row gy-4">
          {items.map((item) => (
            <div className="col-lg-3 col-md-6 col-6" key={item.key}>
              <div className="stats-item text-center w-100 h-100">
                <span className="purecounter" data-stat-key={item.key}>
                  <AnimatedCounter endValue={stats[item.key] || item.defaultVal} />
                </span>
                <p>{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
