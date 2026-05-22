"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImagePlus,
  Trash2,
  Image as ImageIcon,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getSupabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 20;

type Img = {
  id: string;
  image_url: string;
  description: string | null;
  position: number;
};

export function GaleriaView({
  salonId,
  initialImages,
}: {
  salonId: string;
  initialImages: Img[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<Img[]>(initialImages);
  const [reorderMode, setReorderMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      toast.error(`Limite de ${MAX_IMAGES} imagens atingido`);
      return;
    }

    setUploading(true);
    const supabase = getSupabase();
    let uploaded = 0;

    for (const file of toUpload) {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `salons/${salonId}/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("portfolio")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);

        const nextPos =
          images.length + uploaded === 0
            ? 0
            : (images[images.length - 1]?.position ?? -1) + 1 + uploaded;

        const { error: dbErr } = await supabase
          .from("salon_portfolio_images")
          .insert({
            salon_id: salonId,
            image_url: pub.publicUrl,
            position: nextPos,
          });
        if (dbErr) throw dbErr;

        uploaded++;
      } catch (e) {
        console.error(e);
        toast.error("Erro ao fazer upload de uma imagem");
      }
    }

    setUploading(false);
    if (uploaded > 0) {
      toast.success(`${uploaded} ${uploaded === 1 ? "foto adicionada" : "fotos adicionadas"}`);
      router.refresh();
    }
  }

  async function deleteImage(id: string) {
    if (!confirm("Eliminar esta foto?")) return;
    const supabase = getSupabase();
    const prev = images;
    setImages((cur) => cur.filter((i) => i.id !== id));
    const { error } = await supabase
      .from("salon_portfolio_images")
      .delete()
      .eq("id", id);
    if (error) {
      setImages(prev);
      toast.error("Erro ao eliminar");
      return;
    }
    toast.success("Foto eliminada");
    router.refresh();
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = images.findIndex((i) => i.id === active.id);
      const newIdx = images.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(images, oldIdx, newIdx);
      setImages(reordered);

      // Persistir nova ordem
      const supabase = getSupabase();
      await Promise.all(
        reordered.map((img, i) =>
          supabase
            .from("salon_portfolio_images")
            .update({ position: i })
            .eq("id", img.id)
        )
      );
      toast.success("Ordem guardada");
    },
    [images]
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Portfolio"
        title="Galeria"
        description={`${images.length} de ${MAX_IMAGES} fotos publicadas no perfil do salão`}
        action={
          <div className="flex gap-2">
            {images.length > 1 && (
              <button
                onClick={() => setReorderMode((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border",
                  reorderMode
                    ? "bg-violet-50 border-violet-200 text-violet-700"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                <GripVertical className="h-4 w-4" />
                {reorderMode ? "Concluir ordem" : "Reordenar"}
              </button>
            )}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading || remaining <= 0}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploading
                ? "A enviar..."
                : remaining <= 0
                ? "Limite atingido"
                : "Adicionar foto"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBox label="Fotos" value={images.length.toString()} />
        <StatBox label="Disponíveis" value={remaining.toString()} />
        <StatBox label="Limite" value={MAX_IMAGES.toString()} />
      </div>

      {images.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Galeria vazia"
          description="Adiciona fotos do teu trabalho — boas imagens trazem mais clientes."
          action={
            <button
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-xl"
            >
              <Upload className="h-4 w-4" />
              Carregar a primeira foto
            </button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <ImageCell
                  key={img.id}
                  img={img}
                  reorderMode={reorderMode}
                  onDelete={() => deleteImage(img.id)}
                  onOpen={() => setViewerIndex(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {viewerIndex !== null && (
        <Viewer
          images={images}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onChange={setViewerIndex}
        />
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ImageCell({
  img,
  reorderMode,
  onDelete,
  onOpen,
}: {
  img: Img;
  reorderMode: boolean;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id, disabled: !reorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200",
        reorderMode && "cursor-grab active:cursor-grabbing ring-2 ring-violet-400 ring-offset-2"
      )}
      {...(reorderMode ? { ...attributes, ...listeners } : {})}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.image_url}
        alt={img.description ?? ""}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {reorderMode ? (
        <div className="absolute inset-0 bg-violet-900/20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 rounded-full p-2">
            <GripVertical className="h-5 w-5 text-violet-700" />
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={onOpen}
            className="absolute inset-0 w-full h-full"
            aria-label="Ver"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/95 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

function Viewer({
  images,
  index,
  onClose,
  onChange,
}: {
  images: Img[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const img = images[index];
  const prev = () => onChange(index > 0 ? index - 1 : images.length - 1);
  const next = () => onChange(index < images.length - 1 ? index + 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-6 text-white/80 text-sm font-medium">
        {index + 1} / {images.length}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.image_url}
        alt=""
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
