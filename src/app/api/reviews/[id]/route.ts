/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Review from "../../../../models/Review";
import mongoose from "mongoose";

interface ReviewRouteParams {
  params: {
    id: string; // L'ID de la revue
  };
}

export async function GET(request: Request, { params }: ReviewRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Review ID" }, { status: 400 });
  }

  try {
    const review = await Review.findById(id)
      .populate("product", "name slug")
      .populate("user", "username email");

    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error(`Error fetching review with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching review" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: ReviewRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Review ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    console.log(`Updating review with ID ${id}. Received body:`, body);

    // Seuls 'isVerifiedBuyer' et 'reviewStatus' peuvent être mis à jour
    const allowedUpdates: { [key: string]: any } = {};
    if (typeof body.isVerifiedBuyer === "boolean") {
      allowedUpdates.isVerifiedBuyer = body.isVerifiedBuyer;
    }
    if (
      body.reviewStatus &&
      ["Pending", "Approved", "Rejected"].includes(body.reviewStatus)
    ) {
      allowedUpdates.reviewStatus = body.reviewStatus;
    }

    // Si aucune mise à jour valide n'est fournie
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        {
          message:
            "No valid fields provided for update. Only 'isVerifiedBuyer' and 'reviewStatus' can be updated.",
        },
        { status: 400 }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    if (!updatedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    // Logique pour la suppression différée si reviewStatus devient "Rejected"
    if (updatedReview.reviewStatus === "Rejected") {
      console.log(
        `Review ${updatedReview._id} status set to Rejected. Scheduling for delayed deletion.`
      );
      // IMPORTANT: La suppression après un délai ne peut PAS être gérée directement ici
      // dans une fonction serverless de Next.js API Route.
      // Une fonction API Next.js est stateless et son exécution se termine une fois la réponse envoyée.
      //
      // Pour une suppression différée, tu aurais besoin d'une solution de back-end plus robuste :
      // 1. Un service de planification (ex: un cron job sur un serveur dédié, AWS Lambda avec CloudWatch Events).
      // 2. Une file de messages (ex: RabbitMQ, AWS SQS) où tu envoies un message "supprimer cette revue dans X temps".
      // 3. Un champ `deleteAfter` dans le document Review, et un script externe qui nettoie régulièrement.
      //
      // Pour l'instant, je vais juste loguer que la suppression est "planifiée".
      // La suppression directe via l'endpoint DELETE sera toujours disponible pour une suppression immédiate.
    }

    return NextResponse.json(updatedReview, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating review with ID ${id}:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error updating review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: ReviewRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Review ID" }, { status: 400 });
  }

  try {
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Review deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting review with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error deleting review" },
      { status: 500 }
    );
  }
}
