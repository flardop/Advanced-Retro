#!/usr/bin/env python3
"""
Agrupa imágenes pendientes por similitud visual usando perceptual hash.

Uso:
  python scripts/cluster-pending-images.py
  python scripts/cluster-pending-images.py --threshold 8

Salida:
  - Imagenes/Organizadas/_report/pendientes-clusters.csv
  - Imagenes/Organizadas/_report/pendientes-clusters-summary.csv
  - Imagenes/Organizadas/_report/mapeo-por-cluster.csv
"""

from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

import imagehash
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()


@dataclass
class PendingImage:
  path: Path
  file_name: str
  phash: imagehash.ImageHash


@dataclass
class Cluster:
  cluster_id: str
  representative: PendingImage
  items: List[PendingImage]


VALID_EXTS = {
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
}


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser()
  parser.add_argument(
    "--pending-dir",
    default="Imagenes/Organizadas/pendientes",
    help="Carpeta de pendientes",
  )
  parser.add_argument(
    "--report-dir",
    default="Imagenes/Organizadas/_report",
    help="Carpeta de reportes",
  )
  parser.add_argument(
    "--threshold",
    type=int,
    default=6,
    help="Distancia maxima de Hamming para agrupar",
  )
  return parser.parse_args()


def iter_images(root: Path) -> List[Path]:
  out: List[Path] = []
  for p in sorted(root.iterdir()):
    if not p.is_file():
      continue
    if p.name == ".DS_Store":
      continue
    if p.suffix.lower() not in VALID_EXTS:
      continue
    out.append(p)
  return out


def compute_hash(path: Path) -> imagehash.ImageHash:
  with Image.open(path) as img:
    return imagehash.phash(img.convert("RGB"))


def cluster_images(items: List[PendingImage], threshold: int) -> List[Cluster]:
  clusters: List[Cluster] = []
  unassigned = items[:]

  while unassigned:
    rep = unassigned.pop(0)
    members = [rep]
    rest: List[PendingImage] = []

    for item in unassigned:
      distance = rep.phash - item.phash
      if distance <= threshold:
        members.append(item)
      else:
        rest.append(item)

    unassigned = rest
    cluster_id = f"C{len(clusters) + 1:03d}"
    clusters.append(Cluster(cluster_id=cluster_id, representative=rep, items=members))

  return clusters


def main() -> None:
  args = parse_args()
  cwd = Path.cwd()
  pending_dir = (cwd / args.pending_dir).resolve()
  report_dir = (cwd / args.report_dir).resolve()
  report_dir.mkdir(parents=True, exist_ok=True)

  if not pending_dir.exists():
    raise SystemExit(f"❌ No existe carpeta pendientes: {pending_dir}")

  files = iter_images(pending_dir)
  if not files:
    raise SystemExit("⚠️ No hay imágenes en pendientes.")

  pending_images: List[PendingImage] = []
  failures = 0
  for path in files:
    try:
      h = compute_hash(path)
      pending_images.append(PendingImage(path=path, file_name=path.name, phash=h))
    except Exception:
      failures += 1

  if not pending_images:
    raise SystemExit("❌ No se pudo procesar ninguna imagen.")

  clusters = cluster_images(pending_images, args.threshold)

  detail_csv = report_dir / "pendientes-clusters.csv"
  summary_csv = report_dir / "pendientes-clusters-summary.csv"
  mapping_csv = report_dir / "mapeo-por-cluster.csv"

  with detail_csv.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(
      [
        "cluster_id",
        "representative_file",
        "file_name",
        "distance_to_representative",
        "source_path",
      ]
    )
    for cluster in clusters:
      rep_hash = cluster.representative.phash
      for item in sorted(cluster.items, key=lambda x: x.file_name.lower()):
        dist = rep_hash - item.phash
        writer.writerow(
          [
            cluster.cluster_id,
            cluster.representative.file_name,
            item.file_name,
            dist,
            str(item.path),
          ]
        )

  with summary_csv.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["cluster_id", "size", "representative_file"])
    for cluster in sorted(clusters, key=lambda c: len(c.items), reverse=True):
      writer.writerow([cluster.cluster_id, len(cluster.items), cluster.representative.file_name])

  with mapping_csv.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(
      [
        "cluster_id",
        "representative_file",
        "cluster_size",
        "mapped_product_name",
        "mapped_category",
        "action",
        "notes",
      ]
    )
    for cluster in sorted(clusters, key=lambda c: len(c.items), reverse=True):
      writer.writerow(
        [
          cluster.cluster_id,
          cluster.representative.file_name,
          len(cluster.items),
          "",
          "",
          "review",
          "",
        ]
      )

  largest = sorted((len(c.items) for c in clusters), reverse=True)[:10]
  print("--- Clustering Pendientes ---")
  print(f"Pendientes procesadas: {len(pending_images)}")
  print(f"Fallos al leer imagen: {failures}")
  print(f"Clusters generados: {len(clusters)}")
  print(f"Top tamanos cluster: {largest}")
  print(f"Detalle: {detail_csv}")
  print(f"Resumen: {summary_csv}")
  print(f"Mapeo por cluster: {mapping_csv}")


if __name__ == "__main__":
  main()

