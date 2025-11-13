"""
Slug generation utility for creating URL-safe slugs from names.

This utility handles:
- Converting names to lowercase URL-safe slugs
- Removing special characters and accents
- Handling duplicates with numeric suffixes
- Database uniqueness validation
"""
import re
import unicodedata
from typing import Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession


def generate_slug(name: str) -> str:
    """
    Generate a URL-safe slug from a name.

    Examples:
        "Pest Agent" → "pest-agent"
        "Mabel's Labels!" → "mabels-labels"
        "Collé à Moi" → "colle-a-moi"
        "Cleio Test" → "cleio-test"

    Args:
        name: The name to convert to a slug

    Returns:
        URL-safe slug string
    """
    # Normalize unicode characters (remove accents)
    # NFD = Canonical Decomposition (separates base characters from accents)
    normalized = unicodedata.normalize('NFD', name)

    # Remove accent marks (combining characters)
    without_accents = ''.join(
        char for char in normalized
        if unicodedata.category(char) != 'Mn'  # Mn = Mark, Nonspacing
    )

    # Convert to lowercase
    slug = without_accents.lower()

    # Replace apostrophes and special quotes with empty string
    slug = re.sub(r"['']", '', slug)

    # Replace spaces and other non-alphanumeric characters with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)

    # Remove leading and trailing hyphens
    slug = slug.strip('-')

    # Replace multiple consecutive hyphens with a single hyphen
    slug = re.sub(r'-+', '-', slug)

    return slug


async def generate_unique_slug(
    db: AsyncSession,
    name: str,
    model_class,
    exclude_id: Optional[str] = None,
    max_attempts: int = 100
) -> str:
    """
    Generate a unique slug by checking the database for duplicates.

    If a slug already exists, appends -1, -2, -3, etc. until a unique slug is found.

    Args:
        db: Database session
        name: The name to convert to a slug
        model_class: The SQLModel class to check for uniqueness (e.g., Client)
        exclude_id: Optional ID to exclude from uniqueness check (for updates)
        max_attempts: Maximum number of attempts to find a unique slug

    Returns:
        Unique slug string

    Raises:
        RuntimeError: If unable to find a unique slug after max_attempts
    """
    base_slug = generate_slug(name)
    slug = base_slug
    attempt = 1

    while attempt <= max_attempts:
        # Check if slug exists in database
        query = select(model_class).where(model_class.slug == slug)

        # Exclude current record if updating
        if exclude_id:
            query = query.where(model_class.id != exclude_id)

        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if not existing:
            # Slug is unique!
            return slug

        # Slug exists, try with suffix
        slug = f"{base_slug}-{attempt}"
        attempt += 1

    raise RuntimeError(
        f"Unable to generate unique slug for '{name}' after {max_attempts} attempts"
    )


# Test cases for slug generation
if __name__ == "__main__":
    # Test basic slug generation
    test_cases = [
        ("Pest Agent", "pest-agent"),
        ("Mabel's Labels!", "mabels-labels"),
        ("Collé à Moi", "colle-a-moi"),
        ("Cleio Test", "cleio-test"),
        ("UPPERCASE NAME", "uppercase-name"),
        ("Multiple   Spaces", "multiple-spaces"),
        ("Special!@#$%Characters", "special-characters"),
        ("Café résumé naïve", "cafe-resume-naive"),
        ("  Leading and Trailing  ", "leading-and-trailing"),
        ("hyphen-already-exists", "hyphen-already-exists"),
    ]

    print("Testing slug generation:")
    print("=" * 60)

    all_passed = True
    for input_name, expected_slug in test_cases:
        result = generate_slug(input_name)
        passed = result == expected_slug
        status = "PASS" if passed else "FAIL"

        if not passed:
            all_passed = False

        print(f"[{status}] '{input_name}' -> '{result}' (expected: '{expected_slug}')")

    print("=" * 60)
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed")
