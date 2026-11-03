import { requireHouse } from "@/lib/auth";
import { listMaterials } from "@/services/materials";
import { MaterialForms } from "@/components/material-forms";
import { formatCents, formatGrams } from "@/lib/format";

export const metadata = { title: "Materials" };

export default async function MaterialsPage() {
  const { houseId, role } = await requireHouse();
  const materials = await listMaterials(houseId);
  const canManage = role === "OWNER" || role === "LAB";
  const stockValue = materials.reduce(
    (sum, material) => sum + (material.stockMg / 1000) * material.costCentsPerGram,
    0
  );

  return (
    <div className="materials-page">
      <header className="page-head">
        <div>
          <p className="kicker">The cabinet / raw materials</p>
          <h1>Materials</h1>
        </div>
        <div className="page-head__metric">
          <span className="micro">Stock on hand</span>
          <strong>{formatCents(Math.round(stockValue))}</strong>
        </div>
      </header>

      {canManage ? (
        <MaterialForms materials={materials.map((material) => ({ id: material.id, name: material.name, code: material.code }))} />
      ) : (
        <p className="empty-note">The cabinet is read only for your role. The lab keeps the drawers.</p>
      )}

      <div className="table-wrap materials-table-wrap" role="region" aria-label="Material inventory" tabIndex={0}>
        <table className="materials-table">
          <caption className="sr-only">House materials and stock</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Material</th>
              <th scope="col">Family / note</th>
              <th scope="col" className="num">Stock</th>
              <th scope="col" className="num">Reorder</th>
              <th scope="col" className="num">Cost / g</th>
              <th scope="col" className="num">Cap</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => {
              const low = material.stockMg <= material.reorderMg;
              return (
                <tr key={material.id}>
                  <td className="mono">{material.code}</td>
                  <th scope="row">
                    <span className="material-name">{material.name}</span>
                    <span className="material-description">{material.description}</span>
                  </th>
                  <td>{material.family} / {material.note.toLowerCase()}</td>
                  <td className="num mono">{formatGrams(material.stockMg)}</td>
                  <td className="num mono">{formatGrams(material.reorderMg)}</td>
                  <td className="num mono">{formatCents(material.costCentsPerGram)}</td>
                  <td className="num mono">{material.maxPpt}</td>
                  <td>{low ? <span className="status status--low">Below line</span> : <span className="mono">in stock</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="micro">
        Costs and persistence are house estimates. The cap is a house rule, not a safety or
        regulatory limit.
      </p>
    </div>
  );
}
