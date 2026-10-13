import {Link} from "react-router-dom";

function ServiceCard({ icon, title, description, to }) {

  const isAnchor = to.startsWith("#");
  
  return (
    <article className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-elevated text-text transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:shadow-elevated">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/80 text-white">
            {icon}
        </div>

        <div className="flex flex-col gap-1 mb-2">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm md:text-xs">{description}</p>
        </div>

        {isAnchor ? (
                <a href={to} className="bg-secondary text-white px-8 py-2 rounded-lg hover:bg-secondary-hover transition-colors mx-auto">
                    View
                </a>
            ) : (
                <Link to={to} className="bg-secondary text-white px-8 py-2 rounded-lg hover:bg-secondary-hover transition-colors mx-auto">
                    View
                </Link>
            )}
        {/* <Link to={to}>View</Link> */}
    </article>
  );
}

export default ServiceCard;