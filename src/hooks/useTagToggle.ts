import { useMultiTrackTagging } from "./useMultiTrackTagging";
import { useTagData } from "./useTagData";
import { useTrackState } from "./useTrackState";

export function useTagToggle() {
  const { toggleTagSingleTrack } = useTagData();
  const { toggleTagMultiTrack, isMultiTagging } = useMultiTrackTagging();
  const { activeTrack } = useTrackState();

  const handleToggleTag = (
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => {
    if (isMultiTagging) {
      toggleTagMultiTrack(categoryId, subcategoryId, tagId);
    } else if (activeTrack) {
      toggleTagSingleTrack(activeTrack.uri, categoryId, subcategoryId, tagId);
    }
  };

  return { handleToggleTag };
}
