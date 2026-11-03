import { notFound } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoleForm } from "@/components/role-form";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const { houseId, role } = await requireHouse();
  if (role !== "OWNER") notFound();

  const members = await prisma.membership.findMany({
    where: { houseId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  const owners = members.filter((member) => member.role === "OWNER").length;

  return (
    <div className="team-page">
      <header className="page-head">
        <div>
          <p className="kicker">The house / people and roles</p>
          <h1>Team</h1>
        </div>
        <p className="page-head__note">
          Four hands keep the room. The owner holds the keys; the last owner cannot be demoted.
        </p>
      </header>

      <div className="team-list">
        {members.map((member) => (
          <article className="team-row" key={member.id}>
            <div className="team-row__person">
              <span className="team-row__initial">{member.user.name.slice(0, 1)}</span>
              <div>
                <strong>{member.user.name}</strong>
                <span>{member.user.email}</span>
              </div>
            </div>
            <div className="team-row__meta">
              <span className="mono">joined {formatDate(member.createdAt)}</span>
              <span className="mono">{member.role.toLowerCase()}</span>
            </div>
            <RoleForm
              membershipId={member.id}
              current={member.role}
              disabled={member.role === "OWNER" && owners <= 1}
            />
          </article>
        ))}
      </div>

      <p className="micro">
        Role changes are audited. A perfumer composes, an evaluator reads, the lab weighs, and the
        owner can do all three.
      </p>
    </div>
  );
}
