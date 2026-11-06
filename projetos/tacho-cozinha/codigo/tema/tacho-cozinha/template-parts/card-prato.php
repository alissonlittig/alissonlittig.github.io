<article class="dish">
	<a class="dish-pic" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php echo tacho_art( get_the_ID(), '' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	</a>
	<div class="dish-body">
		<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
		<?php $tag = get_post_meta( get_the_ID(), 'tacho_tag', true ); ?>
		<?php if ( $tag ) : ?><p class="chip"><?php echo esc_html( $tag ); ?></p><?php endif; ?>
		<p class="dish-desc"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<p class="price"><?php echo esc_html( tacho_price() ); ?></p>
	</div>
</article>
