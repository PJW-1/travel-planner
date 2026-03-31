type TrendCardProps = {
  title: string;
  rank: number;
  tag: string;
};

export function TrendCard({ title, rank, tag }: TrendCardProps) {
  return (
    <article className="trend-card">
      <span className="trend-card__rank">Rank {rank}</span>
      <h3>{title}</h3>
      <span className="tag-pill">#{tag}</span>
    </article>
  );
}
